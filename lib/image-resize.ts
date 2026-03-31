// lib/image-resize.ts
// 클라이언트 사이드 이미지 리사이즈 (canvas 활용)

/**
 * 이미지 파일을 최대 크기에 맞게 리사이즈하여 Blob으로 반환
 * - 긴 변 기준 maxSize px 이하로 축소
 * - JPEG 품질 0.85로 압축
 * - 이미 작은 이미지는 그대로 반환
 */
export async function resizeImage(
  file: File,
  maxSize = 1920,
  quality = 0.85
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // 리사이즈 필요 없으면 원본 반환
      if (width <= maxSize && height <= maxSize && file.size <= 4 * 1024 * 1024) {
        resolve(file);
        return;
      }

      // 비율 유지하며 축소
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const resized = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(resized);
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("이미지를 읽을 수 없습니다"));
    img.src = URL.createObjectURL(file);
  });
}
