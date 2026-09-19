// Past this the reader has waited long enough: whatever waits on the image
// goes ahead, and the image lands when it can.
const IMAGE_WAIT_MS = 800;

export const whenDecoded = (url: string) => {
  const image = new Image();
  image.src = url;
  return Promise.race([
    image.decode().catch(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, IMAGE_WAIT_MS)),
  ]);
};
