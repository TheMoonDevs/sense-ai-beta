const PIXABAY_BASE_URL = `https://pixabay.com/api/`;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

export const PixabaySdk = {
  searchPhotos: async (query: string, settings: { page: number }) => {
    try {
      const response = await fetch(
        `${PIXABAY_BASE_URL}?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(
          query
        )}&page=${settings.page}&per_page=5`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        throw new Error(
          `Error fetching photos from Pixabay: ${response.statusText}`
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching photos from Pixabay", error);
      throw error;
    }
  },
};
