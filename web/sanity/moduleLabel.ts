export function moduleLabel(_type: string | undefined): string {
  switch (_type) {
    case "module.text":
      return "Text";
    case "module.media":
      return "Media";
    case "module.carousel":
      return "Carousel";
    case "module.contentRefs":
      return "Content references";
    default:
      return _type?.replace(/^module\./, "") ?? "Module";
  }
}
