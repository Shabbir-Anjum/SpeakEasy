const GenerateAvatar = async (prompt) => {
  try {
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
    });

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
    console.error("Error:", err); // Debug log
    throw new Error(err.message); // Throw the error to propagate it properly
  }
};

export default GenerateAvatar;