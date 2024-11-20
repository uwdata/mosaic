<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Protein Design Explorer

Explore synthesized proteins generated via
[RFDiffusion](https://www.bakerlab.org/2023/07/11/diffusion-model-for-protein-design/).
"Minibinders" are small proteins that bind to a specific protein target.
When designing a minibinder, a researcher inputs the structure of the
target protein and other parameters into the AI diffusion model. Often, a
single, promising (parent) _version_ can be run through the model again to
produce additional, similar designs to better sample the design space.

The pipeline generates tens of thousands of protein designs. The metric
_pAE_ (predicted alignment error) measures how accurate a model was at
predicting the minibinder shape, whereas _pLDDT_ (predicted local distance
difference test) measures a model's confidence in minibinder structure
prediction. For _pAE_ lower is better, for _pLDDT_ higher is better.

Additional parameters include _partial t_ to set the time steps used by
the model, _noise_ to create more diversity of designs, _gradient decay
function_ and _gradient scale_ to guide prioritizing different positions
at different time points, and _movement_ to denote whether the minibinder
was left in its original position ("og") or moved to a desirable position
("moved").

The dashboard below enables exploration of the results to identify
promising protein designs and assess the effects of process parameters.

<Example spec="/specs/yaml/protein-design.yaml" />

**Credit**: Adapted from a [UW CSE 512](https://courses.cs.washington.edu/courses/cse512/24sp/) project by Christina Savvides, Alexander Shida, Riti Biswas, and Nora McNamara-Bordewick. Data from the [UW Institute for Protein Design](https://www.ipd.uw.edu/).


## Specification

::: code-group
<<< @/public/specs/esm/protein-design.js [JavaScript]
<<< @/public/specs/yaml/protein-design.yaml [YAML]
<<< @/public/specs/json/protein-design.json [JSON]
:::
