/**
 * GROQ fragment for `modules[]` with `module.text` bodies, `module.media` assets, and resolved internal links.
 */
export const modulesFieldGroq = `modules[]{
  _key,
  _type,
  _type == "module.text" => {
    title,
    body[]{
      _key,
      _type,
      language,
      value[]{
        ...,
        markDefs[]{
          ...,
          _type == "link" => {
            ...,
            "resolvedReference": reference->{
              _type,
              "slug": slug.current
            }
          }
        }
      }
    }
  },
  _type == "module.media" => {
    type,
    imageContent{
      caption,
      image{
        crop,
        hotspot,
        asset->{
          _id,
          url,
          metadata{
            dimensions{ width, height, aspectRatio },
            lqip
          }
        }
      }
    },
    videoContent{
      caption,
      videoSettings,
      video{
        asset->{
          playbackId,
          data
        }
      },
      poster{
        crop,
        hotspot,
        asset->{
          _id,
          url,
          metadata{
            dimensions{ width, height }
          }
        }
      }
    }
  }
}`;
