from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud import secretmanager
import os

app = Flask(__name__)
CORS(app) # any

print("api_server.py GCP_PROJECT_ID:", os.environ.get("GCP_PROJECT_ID"))


@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({'message': 'pong'})

@app.route('/api/set-api-key', methods=['POST'])
def set_api_key():
    """Endpoint to receive and set the API key in Google Cloud Secret Manager"""
    print("Received request to set API key")
    data = request.json

    if not data or 'apiKey' not in data:
        print("Error: API key is missing from request")
        return jsonify({'success': False, 'message': 'API key is required'}), 400

    api_key = data['apiKey']
    print(f"API key received: {api_key[:4]}...")

    project_id = os.environ.get("GCP_PROJECT_ID")  # Set this in your env
    secret_id = "groq-api-key"  # Static name used by all services

    try:
        client = secretmanager.SecretManagerServiceClient()
        parent = f"projects/{project_id}"

        # Check if the secret exists, create if not
        try:
            client.get_secret(request={"name": f"{parent}/secrets/{secret_id}"})
            print("Secret already exists.")
        except Exception:
            client.create_secret(
                request={
                    "parent": parent,
                    "secret_id": secret_id,
                    "secret": {"replication": {"automatic": {}}},
                }
            )
            print("Secret created.")

        # Add new version
        client.add_secret_version(
            request={
                "parent": f"{parent}/secrets/{secret_id}",
                "payload": {"data": api_key.encode("UTF-8")},
            }
        )
        print("API key uploaded to Secret Manager.")
        return jsonify({'success': True, 'message': 'API key set successfully'}), 200

    except Exception as e:
        print(f"Error uploading API key: {e}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

# Image upload endpoints can be added here if needed

@app.route('/upload', methods=['POST'])
def upload_image():
    """Endpoint to receive and save uploaded images"""
    # Check if the post request has the file part
    if 'image' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    
    # Set up upload folder
    UPLOAD_FOLDER = 'uploads'
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    
    # Process the uploaded files
    files = request.files.getlist('image')
    responses = []
    
    # Define allowed extensions
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    
    # Helper function to check file extension
    def allowed_file(filename):
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    
    # Process each file
    for file in files:
        if file and allowed_file(file.filename):
            from werkzeug.utils import secure_filename
            import uuid
            
            original_filename = secure_filename(file.filename)
            extension = original_filename.rsplit('.', 1)[1].lower()
            unique_filename = f"{uuid.uuid4().hex}.{extension}"
            file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
            file.save(file_path)
            
            # Save the image path to a file that main process can read
            with open('last_uploaded_image.txt', 'w') as f:
                f.write(file_path)
            
            responses.append({
                'success': True,
                'filename': unique_filename,
                'original_filename': original_filename,
                'file_path': file_path
            })
        else:
            responses.append({'error': f'File type not allowed: {file.filename}'})
    
    return jsonify(responses), 200

@app.route('/status', methods=['GET'])
def status():
    return jsonify({'status': 'API is running'})

if __name__ == '__main__':
    print("Starting Flask API server on port 5001...")
    app.run(debug=False, host='0.0.0.0', port=5001)