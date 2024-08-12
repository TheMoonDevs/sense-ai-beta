const PEXELS_BASE_URL = `https://api.pexels.com/v1/search`;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

export const PexelsSdk = {
  searchPhotos: async (query: string, settings: { page: number }) => {
    try {
      const numResults = 5;
      const response = await fetch(
        `${PEXELS_BASE_URL}?query=${encodeURIComponent(query)}&page=${
          settings.page
        }&per_page=${numResults}`,
        {
          method: "GET",
          headers: {
            Authorization: `${PEXELS_API_KEY}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(
          `Error fetching photos from Pexels: ${response.statusText}`
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching photos from Pexels", error);
      throw error;
    }
  },
};
