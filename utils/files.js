import fs from "fs";

export const ensureDirExists = (filePath) => {
  if (fs.existsSync(filePath)) {
    return true;
  }
  fs.mkdirSync(filePath, { recursive: true });
};
