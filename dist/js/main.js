import Counter from "./Counter";
const counter = new Counter();

const initApp = () => {
  const dropArea = document.querySelector(".drop-area");
  const active = () => dropArea.classList.add("green-border");
  const inactive = () => dropArea.classList.remove("green-border");
  const prevents = (e) => e.preventDefault();

  ["dragover", "drop"].forEach((evtName) => {
    dropArea.addEventListener(evtName, prevents);
  });

  ["dragenter", "dragover"].forEach((evtName) => {
    dropArea.addEventListener(evtName, active);
  });

  ["dragleave", "drop"].forEach((evtName) => {
    dropArea.addEventListener(evtName, inactive);
  });

  dropArea.addEventListener("drop", handleDrop);
};

document.addEventListener("DOMContentLoaded", initApp);

const handleDrop = (e) => {
  const dt = e.dataTransfer;
  const files = dt.files;
  const fileArray = [...files];

  if (fileArray.length > 20) return alert("Too Many Files");
  handleFiles(fileArray);
  //   console.log(files);
  //   console.log(fileArray);
};

const handleFiles = (fileArray) => {
  fileArray.forEach((file) => {
    const fileID = counter.getValue(); // counter
    counter.incrementValue(); // increment

    if (file.size / 1024 / 1024 > 4) return alert("File Over 4 MB");

    createResult(file, fileID);
    uploadFile(file, fileID);
  });
};

const createResult = (file, fileID) => {
  const origFileSizeString = getFileSizeString(file.size);

  const p1 = document.createElement("p");
  p1.className = "results_tile";
  p1.textContent = file.name;

  const p2 = document.createElement("p");
  p2.id = `orig_size_${file.name}_${fileID}`;
  p2.className = "results_size";
  p2.textContent = origFileSizeString;

  const divOne = document.createElement("div");
  divOne.appendChild(p1);
  divOne.appendChild(p2);

  const progress = document.createElement("progress");
  progress.id = `progress_${file.name}_${fileID}`;
  progress.className = "results_bar";
  progress.max = 10;
  progress.value = 0;

  const p3 = document.createElement("p");
  p3.id = `new_size_${file.name}_${fileID}`;
  p2.className = "results_size";

  const p4 = document.createElement("p");
  p4.id = `download_${file.name}_${fileID}`;
  p2.className = "results_download";

  const p5 = document.createElement("p");
  p4.id = `saved_${file.name}_${fileID}`;
  p2.className = "results_saved";

  const divDL = document.createElement("div");
  divDL.className = "divDL";
  divDL.appendChild(p4);
  divDL.appendChild(p5);

  const divTwo = document.createElement("div");
  divDL.appendChild(p3);
  divDL.appendChild(divDL);

  const li = document.createElement("li");
  li.appendChild(divOne);
  li.appendChild(progress);
  li.appendChild(divTwo);

  document.querySelector(".results_list").appendChild(li);
  displayResults();
};

const getFileSizeString = (fileSize) => {
  const sizeInKB = parseFloat(fileSize) / 1024;
  const sizeInMB = parseFloat(fileSize) / 1024 / 1024;
  return sizeInKB > 1024
    ? `${sizeInMB.toFixed(1)} MB`
    : `${sizeInKB.toFixed(1)} KB`;
};

const displayResults = () => {
  const results = document.querySelector(".results");

  if (results.classList.contains("none")) {
    results.classList.remove("none");
    results.classList.add("block");
  }
};

const uploadFile = (file, fileID) => {
  const reader = new FileReader();
  reader.addEventListener("loadend", async (e) => {
    const fileName = file.name;
    const base64String = e.target.result;
    const extension = fileName.split(".").pop();
    const name = fileName.slice(0, fileName.length - (extension.length + 1));
    const body = { base64String, name, extension };
    const url = "./.netlify/functions/compress_files";

    try {
      const fileStream = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        isBase64Encoded: true,
      });

      const imgJson = await fileStream.json();

      if (imgJson.error) return handleFileError(fileName, fileID);

      updateProgressBar(file, fileID, imgJson);
    } catch (err) {
      console.error(err);
    }
  });

  reader.readAsDataURL(file);
};

const handleFileError = (fileName, fileID) => {
  const progress = document.getElementById(`progress_${fileName}_${fileID}`);
  progress.value = 10;
  progress.classList.add("error");
};

const updateProgressBar = (file, fileID, imgJson) => {
  const progress = document.getElementById(`progress_${file.name}_${fileID}`);
  const addProgress = setInterval(() => {
    progress.value += 1;
    if (progress.value === 10) {
      clearInterval(addProgress);
      progress.classList.add("finished");
      populateResult(file, fileID, imgJson);
    }
  }, 50);
};

const populateResult = (file, fileID, imgJson) => {
  const newFileSizeString = getFileSizeString(imgJson, fileSize);
  const percentSaved = getPercentSaved(file.size, imgJson.fileSize);

  const newSize = document.getElementById(`new_size_${file.name}_${fileID}`);
  newSize.textContent = newFileSizeString;

  const download = document.getElementById(`download_${file.name}_${fileID}`);
  const link = createDownloadLink(imgJson);
  download.appendChild(link);

  const saved = document.getElementById(`saved-${file.name}_${fileID}`);
  saved.textContent = `-${Math.round(percentSaved)}%`;
};

const getPercentSaved = (originFileSize, newFileSize) => {
  const origFS = parseFloat(originFileSize);
  const newFS = parseFloat(newFileSize);

  return ((origFS - newFS) / origFS) * 100;
};

const createDownloadLink = (imgJson) => {
  const extension = imgJson.fileName.split(".").pop();
  const link = document.createElement("a");
  link.href = `data:image/${extension};base64,${imgJson.base64CompString}`;
  link.download = imgJson.fileName;
  link.textContent = "download";
  return link;
};
