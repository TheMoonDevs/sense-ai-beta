import {
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  GetObjectCommand,
  GetObjectCommandOutput,
  PutObjectCommand,
  PutObjectCommandOutput,
  S3,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Config } from "../config/env.conf";

export const digitalOceanS3 = {
  s3Client: new S3({
    forcePathStyle: false,
    endpoint: S3Config.spacesEndpoint,
    region: "blr1",
    credentials: {
      accessKeyId: S3Config.spacesAccessKeyId,
      secretAccessKey: S3Config.spacesSecretKey,
    },
  }),
  bucket: S3Config.spacesName,
  folder: "files",
};

export const s3FileUploadSdk = {
  /**
   * Uploads a file from a given URL to the specified bucket on DigitalOcean.
   *
   * @param {Object} params - The parameters for the file upload.
   * @param {string} params.imageUrl - The URL of the image to be uploaded.
   * @param {string} params.fileName - The name to be used for the uploaded file.
   * @param {string} [params.userId] - The ID of the user uploading the file (optional).
   * @param {string} [params.folder] - The folder where the file will be stored (optional).
   * @return {Promise<string | undefined>} - A promise that resolves to the URL of the uploaded file if successful, otherwise undefined.
   */
  uploadFileFromUrl: async ({
    imageUrl,
    fileName,
    userId,
    folder,
  }: {
    imageUrl: string;
    fileName: string;
    userId?: string;
    folder?: string;
  }): Promise<string | undefined> => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.error(`Failed to fetch image from URL: ${imageUrl}`);
        return undefined;
      }
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      let folderName;
      if (!userId) folderName = `${folder || digitalOceanS3.folder}`;
      else folderName = `${folder || digitalOceanS3.folder}/${userId}`;
      const uploadParams = {
        fileInfoWithFileBuffer: {
          fileName: fileName,
          fileType: blob.type || "application/octet-stream",
          fileBuffer: Buffer.from(buffer),
        },
        folder: folderName,
      };
      await digitalOceanS3.s3Client.send(
        new PutObjectCommand({
          Bucket: digitalOceanS3.bucket,
          Key: `${uploadParams.folder}/${uploadParams.fileInfoWithFileBuffer.fileName}`,
          Body: uploadParams.fileInfoWithFileBuffer.fileBuffer,
          ACL: "public-read",
          ContentType: uploadParams.fileInfoWithFileBuffer.fileType,
        })
      );
      return s3FileUploadSdk.getPublicFileUrl({
        file: { name: fileName },
        folder: uploadParams.folder,
      });
    } catch (error) {
      console.error(`Failed to upload image from URL: ${imageUrl}`, error);
      return undefined;
    }
  },

  /**
   * Uploads a file to the specified bucket on digital ocean.
   *
   * @param {Object} params - The parameters for the file upload.
   * @param {any} params.file - The file to be uploaded.
   * @param {string} params.userId - The ID of the user uploading the file.
   * @param {string} params.folder - The folder where the file will be stored.
   * @return {Promise<Object>} A promise that resolves to the response from the S3 upload request.
   */
  uploadFile: ({
    file,
    userId,
    folder,
    fileInfoWithFileBuffer,
  }: {
    file?: any;
    fileInfoWithFileBuffer?: {
      fileName: string;
      fileType: string;
      fileBuffer: any;
    };
    userId?: string;
    folder?: string;
  }): multer.Multer => {
    let folderName: any;

    if (!userId) folderName = `${folder || digitalOceanS3.folder}`;
    else folderName = `${folder || digitalOceanS3.folder}/${userId}`;

    const cloudUpload = multer({
      storage: multerS3({
        s3: digitalOceanS3.s3Client,
        bucket: digitalOceanS3.bucket,
        acl: "public-read",
        contentType: (req, file, cb) => {
          cb(null, file.mimetype);
        },
        serverSideEncryption: "AES256",
        metadata: (req, file, cb) => {
          cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
          cb(null, `${folderName}/${file.originalname}`);
        },
      }),
    });
    return cloudUpload;
    // try {
    //   const Body = file ? file.data : fileInfoWithFileBuffer?.fileBuffer;

    //   let fileName, fileType;
    //   if (file) {
    //     // const fileToJSON = JSON.parse(file);
    //     fileName = file.name;
    //     fileType = file.type;
    //   } else {
    //     fileName = fileInfoWithFileBuffer?.fileName;
    //     fileType = fileInfoWithFileBuffer?.fileType;
    //   }

    //   console.log("FILE NAME", fileName, "FILE TYPE", fileType);
    //   const res = await config.s3Client.send(
    //     new PutObjectCommand({
    //       Bucket: config.bucket,
    //       Key: key,
    //       Body: file ? Buffer.from(Body) : fs.createReadStream(Body.path),
    //       ACL: "public-read",
    //       ContentEncoding: "base64",
    //       ContentType: fileType,
    //       BucketKeyEnabled: true,
    //       Metadata: {
    //         name: fileName,
    //         type: fileType,
    //       },
    //     })
    //   );
    //   return res;
    // } catch (error) {
    //   console.log(error);
    // }
    // return undefined;
  },

  downloadFile: async ({
    userId,
    fileName,
    folder,
  }: {
    userId?: string;
    fileName: any;
    folder?: string;
  }): Promise<GetObjectCommandOutput | undefined> => {
    let key;
    if (!userId) key = `${folder || digitalOceanS3.folder}/${fileName}`;
    else key = `${folder || digitalOceanS3.folder}/${userId}/${fileName}`;
    try {
      const res = await digitalOceanS3.s3Client.send(
        new GetObjectCommand({
          Bucket: digitalOceanS3.bucket,
          Key: key,
        })
      );
      return res;
    } catch (error) {
      console.log(error);
    }
    return undefined; // Add a return statement here
  },

  streamToBuffer: (stream: any) => {
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      stream.on("data", (chunk: any) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });
  },

  getPublicFileUrl: ({
    userId,
    file,
    folder,
  }: {
    userId?: string;
    file: any;
    folder?: string;
  }): string => {
    return userId
      ? ` https://${S3Config.spacesName}.${S3Config.spacesEndpoint?.replace(
          "https://",
          ""
        )}/${folder || digitalOceanS3.folder}/${userId}/${encodeURI(
          file.name || file.fileName
        )}`
      : `https://${S3Config.spacesName}.${S3Config.spacesEndpoint?.replace(
          "https://",
          ""
        )}/${folder || digitalOceanS3.folder}/${encodeURI(
          file.name || file.fileName
        )}`;
  },
  /**
   * Retrieves the private signed URL good for 24 hrs of the file associated with the provided key.
   *
   * @param {string} key - The key used to identify the file.
   * @return {Promise<string | undefined>} The URL of the file if found, otherwise undefined.
   */

  getPrivateFileUrl: async ({
    userId,
    file,
    folder,
  }: {
    userId?: string;
    file: any;
    folder?: string;
  }): Promise<string | undefined> => {
    let key;
    if (!userId) key = `${folder || digitalOceanS3.folder}/${file.name}`;
    else key = `${folder || digitalOceanS3.folder}/${userId}/${file.name}`;
    try {
      const url = await getSignedUrl(
        digitalOceanS3.s3Client,
        new GetObjectCommand({ Bucket: digitalOceanS3.bucket, Key: key }),
        { expiresIn: 3600 * 24 }
      );
      return url;
    } catch (error) {
      console.log(error);
    }
    return undefined;
  },

  /**
   * Deletes a file from the specified bucket on digital ocean.
   *
   * @param {Object} params - The parameters for the file deletion.
   * @param {string} params.userId - The ID of the user who owns the file.
   * @param {string} params.fileName - The name of the file to be deleted.
   * @return {Promise<Object>} A promise that resolves to the response from the S3 delete request.
   */

  deleteFile: async ({
    userId,
    fileName,
    folder,
  }: {
    fileName: string;
    userId?: string;
    folder?: string;
  }): Promise<DeleteObjectCommandOutput | undefined> => {
    let key;
    if (!userId) key = `${folder || digitalOceanS3.folder}/${fileName}`;
    else key = `${folder || digitalOceanS3.folder}/${userId}/${fileName}`;
    try {
      const res = await digitalOceanS3.s3Client.send(
        new DeleteObjectCommand({
          Bucket: digitalOceanS3.bucket,
          Key: key,
        })
      );
      return res;
    } catch (error) {
      console.log(error);
    }
    return undefined;
  },
};
