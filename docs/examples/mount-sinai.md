<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Mount Sinai

This demo shows an interactive dashboard of hospital prices. 

The input menus and searchbox filter can help you see where there is the most discrepancy between the minimum and maximum negotiated rates. This discrepancy is what we help market makers such as large employers aim to reduce, which is a potential key performance indicator for our goal of reducing the price of health care. 

This is an initial prototype demonstrating the technical infrastructure that powers Payless Health, a project in development by the One Fact Foundation, a 501(c)(3) non-profit aiming to reduce the price of health care by building open source AI. 

We can help train your team to work with the 4,000+ [hospital price sheets we have collected](https://data.payless.health/#hospital_price_transparency/), for example to analyze health care claim feeds and identify opportunities to improve health outcomes while reducing the cost of care. Some of the folks we are lucky to work with have already saved $5-10 million dollars through such analyses, and we'd love to help you do the same.

If you have any feedback, want to help build this, or suppport us with a tax-deductible contribution, please join our [chat](https://onefact.zulipchat.com/) or send us an email at [hello@onefact.org](mailto:hello@onefact.org) :)

We need all the help we can get to reduce the price of health care, and it can start from one fact, such as any one discrepancy between these maximum and minimum negotiated rates published by Mount Sinai.

<Example spec="/specs/yaml/mount-sinai.yaml" />

Mount Sinai's charges are pulled from here into our database: https://www.mountsinai.org/about/insurance/msh/price-transparency

(Direct download link: https://www.mountsinai.org/files/MSHealth/Assets/HS/131624096_mount-sinai-hospital_standardcharges.zip)