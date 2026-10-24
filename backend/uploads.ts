import { extname, basename } from "node:path";
import yauzl from "yauzl";
const mimeByExtension = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;
async function isWordZip(buffer: Buffer): Promise<boolean> {
  return new Promise((resolve) => {
    yauzl.fromBuffer(
      buffer,
      { lazyEntries: true, validateEntrySizes: true },
      (error, zip) => {
        if (error || !zip) {
          resolve(false);
          return;
        }
        let count = 0,
          total = 0;
        let document = false,
          types = false;
        let settled = false;
        const finish = (valid: boolean) => {
          if (settled) return;
          settled = true;
          zip.close();
          resolve(valid);
        };
        zip.on("error", () => finish(false));
        zip.on("entry", (entry: yauzl.Entry) => {
          count++;
          total += entry.uncompressedSize;
          if (
            count > 3000 ||
            total > 40 * 1024 * 1024 ||
            /vbaProject\.bin$/i.test(entry.fileName) ||
            entry.isEncrypted() ||
            entry.fileName.includes("..") ||
            entry.uncompressedSize > 15 * 1024 * 1024
          ) {
            finish(false);
            return;
          }
          if (
            !["word/document.xml", "[Content_Types].xml"].includes(
              entry.fileName,
            )
          ) {
            zip.readEntry();
            return;
          }
          zip.openReadStream(entry, (readError, stream) => {
            if (readError || !stream) {
              finish(false);
              return;
            }
            const chunks: Buffer[] = [];
            let size = 0;
            stream.on("data", (chunk: Buffer) => {
              size += chunk.length;
              if (size > 2 * 1024 * 1024) {
                stream.destroy();
                finish(false);
              } else chunks.push(chunk);
            });
            stream.on("error", () => finish(false));
            stream.on("end", () => {
              if (settled) return;
              const value = Buffer.concat(chunks).toString("utf8");
              if (entry.fileName === "word/document.xml")
                document =
                  /<(?:\w+:)?document\b/.test(value) &&
                  value.includes("wordprocessingml");
              else types = value.includes("wordprocessingml.document.main+xml");
              zip.readEntry();
            });
          });
        });
        zip.on("end", () => finish(document && types));
        zip.readEntry();
      },
    );
  });
}
export async function validateResume(file: Express.Multer.File) {
  const extension = extname(
    file.originalname,
  ).toLowerCase() as keyof typeof mimeByExtension;
  const mime = mimeByExtension[extension];
  if (!mime || file.mimetype !== mime)
    throw new Error("Resume type must match its PDF, DOC, or DOCX extension.");
  if (file.size === 0 || file.size > 5 * 1024 * 1024)
    throw new Error("Resume must be nonempty and no larger than 5 MB.");
  let valid = false;
  if (extension === ".pdf")
    valid =
      file.buffer.subarray(0, 5).toString() === "%PDF-" &&
      file.buffer.subarray(-2048).includes(Buffer.from("%%EOF"));
  if (extension === ".doc")
    valid =
      file.buffer
        .subarray(0, 8)
        .equals(Buffer.from("d0cf11e0a1b11ae1", "hex")) &&
      file.buffer.includes(Buffer.from("WordDocument", "utf16le"));
  if (extension === ".docx") valid = await isWordZip(file.buffer);
  if (!valid)
    throw new Error(
      "Resume content is not a recognizable document matching its extension.",
    );
  // Browsers supply only a name; never interpret it as a filesystem path.
  const originalName =
    basename(file.originalname.replace(/\\/g, "/"))
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .slice(0, 180) || `resume${extension}`;
  return { extension, mime, originalName };
}
