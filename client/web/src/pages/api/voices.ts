import { NextApiRequest, NextApiResponse } from "next";

const cartesiaApiKey = process.env.CARTESIA_API_KEY;

export default async function getVoices(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (!cartesiaApiKey) {
      res.statusMessage = "Environment variables aren't set up correctly";
      res.status(500).end();
      return;
    }

    const response = await fetch("https://api.cartesia.ai/voices", {
      method: "GET",
      headers: {
        "X-API-Key": cartesiaApiKey,
        "Cartesia-Version": "2024-08-01",
        "Content-Type": "application/json",
      },
    });

    const voices = await response.json();
    res.status(200).json(voices);
  } catch (e) {
    res.statusMessage = (e as Error).message;
    res.status(500).end();
  }
}
