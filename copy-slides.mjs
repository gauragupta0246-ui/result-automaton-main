import fs from "fs";
import path from "path";

const srcDir = "C:/Users/saura/.gemini/antigravity/brain/211af0a3-096a-4e59-8289-fe94a2ee6eb2/.user_uploaded";
const slides = [
  { src: "media_1793663877308.png", dest: "public/campus-slide-1.png" },
  { src: "media_1793663893790.jpg", dest: "public/campus-slide-2.jpg" },
  { src: "media_1793663914713.png", dest: "public/campus-slide-3.png" },
  { src: "media_1793663951829.png", dest: "public/campus-slide-4.png" },
];

for (const { src, dest } of slides) {
  const fullSrc = path.join(srcDir, src);
  if (fs.existsSync(fullSrc)) {
    fs.copyFileSync(fullSrc, dest);
    console.log(`Copied ${src} -> ${dest}`);
  } else {
    console.error(`Not found: ${fullSrc}`);
  }
}
