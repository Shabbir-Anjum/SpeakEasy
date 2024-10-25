export const DEFAULT_AVATAR_URL = "https://obj-store.livepeer.cloud/livepeer-cloud-ai-images/64755765/2f7c5ee4.png";
export const TIMEOUT_DURATION = 10000; // 10 seconds for Vercel


const GenerateAvatar = async (prompt) => {
  try {
    // for testing
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_DURATION);


    const response = await fetch("/api/livepeer/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        width: 1024,
        height: 1024,
      }),
      signal: controller.signal
    });
 clearTimeout(timeoutId);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to generate image");
    }

    // Check the structure of the response and get the image URL
    if (data.images && data.images.length > 0) {
      const imageUrl = data.images[0].url;
      return imageUrl;
    } else {
      throw new Error("No image generated");
    }

  } catch (err) {
    //console.error("Error:", err); // Debug log
    if (err.name === 'AbortError') {
      return DEFAULT_AVATAR_URL;
    }
    throw new Error(err.message);
  }
};

export default GenerateAvatar;