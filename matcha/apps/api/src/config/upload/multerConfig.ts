import multer from "multer";


const storage = multer.diskStorage({
    destination: function (req : any, file : any, cb : any) {
        cb(null, "public/images/");
    },
    filename: function (req: any, file : any, cb : any) {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
});

export const upload = multer({ storage });