import multer from 'multer';

// Allowed file extensions
const allowedExtensions = [
  '.c',
  '.cpp',
  '.java',
  '.py',
  '.js',
  '.ts',
  '.php',
  '.go'
];

// File filter
const fileFilter = (req, file, cb) => {
  const ext = file.originalname
    .substring(file.originalname.lastIndexOf('.'))
    .toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type. Allowed: ${allowedExtensions.join(', ')}`
      ),
      false
    );
  }
};

// Use memory storage for Vercel
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 1 * 1024 * 1024 // 1 MB
  },
  fileFilter
});

export default upload;