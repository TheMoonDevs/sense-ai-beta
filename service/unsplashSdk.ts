export const UNSPLASH_BASE_URL = `https://api.unsplash.com`;

export const UnsplashSdk = {
  searchPhotos: async (
    query: string,
    settings: {
      page: number;
    }
  ) => {
    try {
      //console.log("settings", process.env.UNSPLASH_ACCESS_KEY);
      const response = await fetch(
        `${UNSPLASH_BASE_URL}/search/photos?page=${
          settings.page ?? 1
        }&query=${query}`,
        {
          method: "GET",
          headers: {
            Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
          },
        }
      );
      if (response.headers.get("X-Ratelimit-Remaining") === "0") {
        throw new Error("Rate limit exceeded");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching photos from Unsplash", error);
    }
  },
};
