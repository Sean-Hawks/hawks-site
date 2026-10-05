# Rajdhani

Source: [Google Fonts](https://github.com/google/fonts/tree/main/ofl/rajdhani).
Designed by Indian Type Foundry; licensed under the adjacent SIL Open Font License.

These display fonts preserve the Latin U+0000–00FF subset of the upstream TTF
files. Chinese text uses the system sans-serif fallback. Both weights retain
upstream name and license metadata. No third-party font service is called.

To regenerate, download `Rajdhani-SemiBold.ttf` and `Rajdhani-Bold.ttf` from the
source directory. With fontTools installed, run for each file:

```python
from fontTools.ttLib import TTFont
from fontTools import subset

font = TTFont(input_path)
options = subset.Options()
options.name_IDs = ["*"]
options.name_languages = ["*"]
options.name_legacy = True
builder = subset.Subsetter(options=options)
builder.populate(unicodes=range(256))
builder.subset(font)
font.save(output_path)
```
