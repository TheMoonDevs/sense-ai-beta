import { v4 as uuidv4 } from "uuid";
import { UnsplashSdk } from "./unsplashSdk";
import { SerpApiSdk } from "./serpApiSdk";
import { PexelsSdk } from "./pexelsSdk";
import { PixabaySdk } from "./pixabaySdk";
import { ModelLabsSdk } from "./modelLabsSdk";
import { s3FileUploadSdk } from "./s3Upload.service";
import { ImageType } from "../types/_data.images";

export const ImageGenSdk = {
  generateImages: async (
    query: string,
    settings: {
      imageType: "stock" | "illustration";
      source: ImageType["source"];
    }
  ) => {
    try {
      console.log("settings", settings);
      let images: ImageType[] = [];

      if (settings.source === "unsplash") {
        const response = await UnsplashSdk.searchPhotos(query, { page: 1 });
        console.log("searched unsplash", response);
        if (response.results) {
          images = response.results.map((photo: any) => {
            const aspectRatio = photo.width / photo.height;
            const orientation =
              aspectRatio > 0.9 && aspectRatio < 1.1
                ? "squarish"
                : aspectRatio >= 1.1
                ? "landscape"
                : "portrait";
            return {
              query,
              image_id: photo.id,
              color: photo.color,
              source: "unsplash",
              orientation,
              description: photo.description,
              imageType: settings.imageType ?? "stock",
              image: photo.urls.regular,
              urls: photo.urls,
            };
          });
        }
      } else if (settings.source === "serpapi") {
        const response = await SerpApiSdk.searchImages(query, { page: 1 });
        console.log("searched serpapi", response);
        if (response.image_results) {
          images = response.image_results.map((image: any) => {
            const aspectRatio = image.original_width / image.original_height;
            const orientation =
              aspectRatio > 0.9 && aspectRatio < 1.1
                ? "squarish"
                : aspectRatio >= 1.1
                ? "landscape"
                : "portrait";
            return {
              query,
              image_id: uuidv4(),
              source: "serpapi",
              orientation,
              description: image.title || "",
              imageType: settings.imageType ?? "stock",
              image: image.original,
              urls: {
                full: image.original,
                thumb: image.thumbnail,
              },
            };
          });
        }
      } else if (settings.source === "pexels") {
        const response = await PexelsSdk.searchPhotos(query, { page: 1 });
        console.log("searched pexels", response);
        if (response.photos) {
          images = response.photos.map((photo: any) => {
            const aspectRatio = photo.width / photo.height;
            const orientation =
              aspectRatio > 0.9 && aspectRatio < 1.1
                ? "squarish"
                : aspectRatio >= 1.1
                ? "landscape"
                : "portrait";
            return {
              query,
              image_id: photo.id,
              color: photo.color,
              source: "pexels",
              orientation,
              description: photo.alt,
              imageType: settings.imageType ?? "stock",
              image: photo.src.original,
              urls: photo.src,
            };
          });
        }
      } else if (settings.source === "pixabay") {
        const response = await PixabaySdk.searchPhotos(query, { page: 1 });
        console.log("searched pixabay", response);
        if (response.hits) {
          images = response.hits.map((photo: any) => {
            const aspectRatio = photo.imageWidth / photo.imageHeight;
            const orientation =
              aspectRatio > 0.9 && aspectRatio < 1.1
                ? "squarish"
                : aspectRatio >= 1.1
                ? "landscape"
                : "portrait";
            return {
              query,
              image_id: photo.id,
              color: photo.colors ? photo.colors[0] : "",
              source: "pixabay",
              orientation,
              description: photo.tags,
              imageType: settings.imageType ?? "stock",
              image: photo.webformatURL,
              urls: {
                full: photo.largeImageURL,
                thumb: photo.webformatURL,
                small: photo.previewURL,
              },
            };
          });
        }
      } else if (settings.source === "modelLabs") {
        // Note: Add suitable models (https://modelslab.com/models) for different image types
        const imageModelTypeMap = [
          {
            type: "stock",
            model: "realistic-vision-v13",
          },
          {
            type: "illustration",
            model: "stablediffusionapi/anything-v3",
          },
        ];
        const model = imageModelTypeMap.find(
          (m) => m.type === settings.imageType
        )?.model;
        const response = await ModelLabsSdk.generateImage({
          prompt: query,
          model,
        });
        console.log("generated image from modelLabs", response);
        const aspectRatio = response?.meta?.W / response?.meta?.H;
        const orientation =
          aspectRatio > 0.9 && aspectRatio < 1.1
            ? "squarish"
            : aspectRatio >= 1.1
            ? "landscape"
            : "portrait";
        if (response.status === "processing") {
          images = [
            {
              query,
              image_id: response.id,
              source: "modelLabs",
              orientation,
              description: response.meta.prompt,
              imageType: settings.imageType ?? "stock",
              image: response.future_links[0],
              urls: response.future_links,
              eta_timestamp: new Date().getTime() + response.eta * 1000,
              fetch_result: response.fetch_result,
              crawlStatus: "pending",
            },
          ];
        } else if (response.status === "completed") {
          images = [
            {
              query,
              image_id: response.id,
              source: "modelLabs",
              orientation,
              description: response.meta.prompt,
              imageType: settings.imageType ?? "stock",
              image: response.output[0],
              urls: response.output,
              crawlStatus: "completed",
            },
          ];
        }
      } else {
        throw new Error("Unknown source type");
      }

      // Upload images to S3 and replace the URLs
      for (const image of images) {
        try {
          const uploadedUrl = await s3FileUploadSdk.uploadFileFromUrl({
            imageUrl: image.image,
            folder: "crawled-images",
            fileName: `${uuidv4()}.jpg`,
          });

          if (uploadedUrl) {
            console.log(`Successfully uploaded image: ${uploadedUrl}`);
            image.image = uploadedUrl;
          } else {
            console.error(`Failed to upload image: ${image.image}`);
          }
        } catch (error) {
          console.error(`Error processing image: ${image.image}`, error);
        }
      }

      return images;
    } catch (error) {
      console.error("Error generating images", error);
      throw error;
    }
  },
};
