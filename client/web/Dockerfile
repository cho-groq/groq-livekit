FROM node:20

WORKDIR /app

# Install pnpm and deps
RUN npm install -g pnpm

COPY . .

RUN pnpm install

EXPOSE 3000

CMD ["pnpm", "dev"]
