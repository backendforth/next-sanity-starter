/**
 * GROQ fragment for `modules[]` with `module.text` bodies and resolved internal links.
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
  }
}`;
