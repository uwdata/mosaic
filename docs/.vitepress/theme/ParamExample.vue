<script>
import { hconcat, slider } from '@uwdata/vgplot';
import { Param } from '@uwdata/mosaic-core';
export default {
  mounted: function() {
    const label = document.createElement('span');
    const param = Param.value(5);
    label.innerText = param.value;
    param.addEventListener('value', value => label.innerText = value);
    const s1 = slider({ label: 'Param', min: 0, max: 10, step: 1, as: param });
    const s2 = slider({ min: 0, max: 15, step: 1, as: param });
    s2.appendChild(label);
    this.$refs.el.replaceChildren(hconcat(s1, s2));
  }
};
</script>

<style>
.param-test label {
  margin-right: 0.5em;
}
.param-test input {
  margin-right: 1em;
}
.param-test * {
  vertical-align: middle;
}
</style>

<template>
<div class="param-test" ref="el">
</div>
</template>
