export function buildTutorialFormData(tutorialData, status) {
  const formData = new FormData();
  formData.append("title", tutorialData.title);
  formData.append("description", tutorialData.shortDescription);
  formData.append("category_id", tutorialData.category);
  formData.append("level", tutorialData.level);
  formData.append("language", tutorialData.language);
  formData.append("status", status ?? tutorialData.status);
  formData.append("is_paid", (!tutorialData.isFree).toString());
  if (!tutorialData.isFree) {
    formData.append("price", tutorialData.price);
  }
  if (tutorialData.tags?.length) {
    formData.append("tags", JSON.stringify(tutorialData.tags));
  }
  if (tutorialData.includedPlans?.length) {
    formData.append(
      "included_plans",
      JSON.stringify(tutorialData.includedPlans)
    );
  }
  if (tutorialData.chapters?.length) {
    const chapters = tutorialData.chapters.map((ch, idx) => ({
      title: ch.title,
      duration: ch.duration,
      video_url: ch.videoUrl,
      order: idx + 1,
      is_preview: ch.preview,
    }));
    formData.append("chapters", JSON.stringify(chapters));
  }
  if (tutorialData.thumbnail instanceof File) {
    formData.append("thumbnail", tutorialData.thumbnail);
  }
  if (tutorialData.preview instanceof File) {
    formData.append("preview", tutorialData.preview);
  }
  return formData;
}
