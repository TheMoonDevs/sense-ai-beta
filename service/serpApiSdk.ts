const SERPAPI_BASE_URL = "https://serpapi.com/search";
const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY;

// NOTE:The APi is returning with 100 results and i couldn't find a query parameter to limit the results so i am limiting the results to 5 in the code

export const SerpApiSdk = {
  searchImages: async (query: string, settings: { page: number }) => {
    try {
      const numResults = 5;

      const startIndex = (settings.page - 1) * numResults;

      const response = await fetch(
        `${SERPAPI_BASE_URL}?engine=google&q=${encodeURIComponent(
          query
        )}&tbm=isch&start=${startIndex}&api_key=${SERPAPI_API_KEY}&num=5`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Error fetching images from SerpApi: ${response.statusText}`
        );
      }

      const data = await response.json();

      const images = data.images_results.slice(0, numResults);
      return { image_results: images };
    } catch (error) {
      console.error("Error fetching images from SerpApi", error);
      throw error;
    }
  },

  searchTextQuery: async (query: string, settings: { page: number }) => {
    try {
      const numResults = 5;
      const startIndex = (settings.page - 1) * numResults;
      const response = await fetch(
        `${SERPAPI_BASE_URL}?engine=google&q=${encodeURIComponent(
          query
        )}&start=${startIndex}&api_key=${SERPAPI_API_KEY}&num=5`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        throw new Error(
          `Error fetching results from SerpApi: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log(data.inline_images, data.organic_results, data.inline_videos);

      const textQueryResult = {
        inline_images: data.inline_images
          ? data.inline_images.slice(0, numResults)
          : [],
        organic_results: data.organic_results
          ? data.organic_results.slice(0, numResults)
          : [],
        inline_videos: data.inline_videos
          ? data.inline_videos.slice(0, numResults)
          : [],
      };

      return { textQueryResult };
    } catch (error) {
      console.error("Error fetching results from SerpApi", error);
      throw error;
    }
  },

  searchVideos: async (query: string, settings: { page: number }) => {
    try {
      const numResults = 5;
      const startIndex = (settings.page - 1) * numResults;
      const response = await fetch(
        `${SERPAPI_BASE_URL}?engine=google&q=${encodeURIComponent(
          query
        )}&tbm=vid&start=${startIndex}&api_key=${SERPAPI_API_KEY}&num=5`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        throw new Error(
          `Error fetching videos from SerpApi: ${response.statusText}`
        );
      }

      const data = await response.json();

      const videos = data.videos_results.slice(0, numResults);

      return { videos_results: videos };
    } catch (error) {
      console.error("Error fetching videos from SerpApi", error);
      throw error;
    }
  },
};
