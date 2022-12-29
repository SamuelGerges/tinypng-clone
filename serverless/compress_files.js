const imagemin = require("imagemin");
const imageminJpegRecompress = require("imagemin-jpeg-recompress");

const imageminPngQuant = require("imagemin-pngquant");

exports.handler = async (event, context) => {
  const params = JSON.parse(event.body);

  const { base64String, name, extension } = params;
  const base64Image = base64String.split(";base64").pop();

  const fileName = `${name}.${extension}`;

  try {
    const result = Buffer.from(base64Image, "base64");
    const newImageBuffer = await imagemin.buffer(result, {
      destination: "serverless/compress_files",
      plugins: [
        imageminJpegRecompress({
          min: 20,
          max: 60,
        }),
        imageminPngQuant({
          quality: [0.2, 0.6],
        }),
      ],
    });
    const fileSize = newImageBuffer.length;
    const base64CompString = newImageBuffer.toString("base64");
    const imageDataObj = { base64CompString, fileName, fileSize };
    return {
      statusCode: 200,
      body: JSON.stringify(imageDataObj),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: stringify({ error: "File Error" }),
    };
  }
};
