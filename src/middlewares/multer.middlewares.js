import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/tmp");
  },
  filename: (req, file, cb) => {
    const timestampPrefix = String(Date.now()) + " - ";
    cb(null, timestampPrefix + file.originalname);
  },
});

export default multer({ storage });
