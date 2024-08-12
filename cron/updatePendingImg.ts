import { ImageCrawlModel } from "../models/_db.imagecrawl";
import { s3FileUploadSdk } from "../service/s3Upload.service";
import { v4 as uuidv4 } from "uuid";
import { connect, disconnect } from "../utils/connect";

const checkProceesedGenerate = async (fetch_result: string) => {
  try {
    const fetchData = async () => {
      const response = await fetch(fetch_result, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: process.env.ML_API_Key,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    };

    let _data = await fetchData();

    if (_data.status === "processing" || _data.status === "failed") {
      return {
        status: "failed",
        error: { message: "Unable to Process Image" },
      };
    } else {
      return {
        status: "success",
        data: _data,
      };
    }
  } catch (err) {
    console.error(err);
    return { status: "failed", error: err };
  }
};

// Fetch all documents with a pending status
async function fetchPendingDocuments() {
  try {
    const pendingDocuments = await ImageCrawlModel.find({
      crawlStatus: "pending",
      eta_timestamp: { $lte: Date.now() },
    });

    // Fetch image URLs and update the documents
    for (const document of pendingDocuments) {
      if (document.source === "modelLabs" && document?.fetch_result) {
        const newImgData = await checkProceesedGenerate(document.fetch_result);
        if (!newImgData || newImgData.status === "failed") {
          document.crawlStatus = "Failed";
        }
        document.urls = newImgData.data.output as string[];
        const uploadedUrl = await s3FileUploadSdk.uploadFileFromUrl({
          imageUrl: newImgData.data.output[0],
          folder: "crawled-images",
          fileName: `${uuidv4()}.jpg`,
        });
        if (uploadedUrl) {
          console.log(`Successfully uploaded image: ${uploadedUrl}`);
          document.image = uploadedUrl;
          document.crawlStatus = "completed";
        } else {
          console.error(`Failed to upload image: ${newImgData.data.output[0]}`);
        }
        await document.save();
      }
    }

    console.log("Image URLs updated successfully!");
  } catch (error) {
    console.error("Error updating image URLs:", error);
  }
}

async function main() {
  try {
    await connect();
    await fetchPendingDocuments(); // Fetch and update documents
  } catch (error) {
    console.error("Error in main function:", error);
  } finally {
    await disconnect(); // Disconnect from the database
  }
}

main();
