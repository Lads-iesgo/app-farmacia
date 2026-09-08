const Jimp = require("jimp");
const path = require("path");

const inputPath = path.join(__dirname, "assets", "images", "logo-farmacia.png");
const outputPath = path.join(
  __dirname,
  "assets",
  "images",
  "logo-farmacia-square.png",
);

async function resizeImage() {
  try {
    const image = await Jimp.read(inputPath);

    // Criar um fundo branco na imagem
    const size = Math.max(image.bitmap.width, image.bitmap.height);
    const background = new Jimp(size, size, 0xffffffff); // White background

    // Calcular posição para centralizar a imagem original
    const x = (size - image.bitmap.width) / 2;
    const y = (size - image.bitmap.height) / 2;

    // Compor as imagens
    background.composite(image, x, y);

    await background.writeAsync(outputPath);
    console.log("✅ Image resized successfully with Jimp!");
  } catch (err) {
    console.error("❌ Error resizing image with Jimp:", err);
  }
}

resizeImage();
