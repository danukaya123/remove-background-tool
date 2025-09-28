const input = document.getElementById("imageInput");
const uploadBtn = document.getElementById("uploadBtn");
const resultImg = document.getElementById("resultImg");
const downloadBtn = document.getElementById("downloadBtn");

uploadBtn.addEventListener("click", async () => {
  const file = input.files[0];
  if (!file) return alert("Select an image!");

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch("/api/remove", { method: "POST", body: formData });
  if (!res.ok) return alert("Error processing image");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  resultImg.src = url;
  downloadBtn.href = url;
  document.getElementById("output").style.display = "block";
});
