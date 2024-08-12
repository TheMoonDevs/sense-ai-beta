import { Request, Response } from "express";
import { s3FileUploadSdk } from "../service/s3Upload.service";

export const getImageFileUrl = async (req: Request, res: Response) => {
  // Check if the file is provided in the request
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    const fileUrl = s3FileUploadSdk.getPublicFileUrl({
      file: {
        name: req.file.originalname,
      },
      folder: "camera-uploads",
    });

    return res.status(200).json({ fileUrl });
  } catch (error) {
    // Handle any errors that occur during the file URL retrieval
    console.error("Error getting file URL:", error);
    return res.status(500).json({ error: "Failed to get file URL." });
  }
};

export const getAudioFileUrl = async (req: Request, res: Response) => {
  // Check if the file is provided in the request
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const mimetype = req.file.mimetype;
  console.log(mimetype);
  try {
    const fileUrl = s3FileUploadSdk.getPublicFileUrl({
      file: {
        name: req.file.originalname,
      },
      folder: "audio-uploads",
    });

    return res.status(200).send({ fileUrl });
  } catch (err) {
    console.log("Error during processing or upload:", err);
    return res.status(500).send("Error during processing or upload.");
  }
};
