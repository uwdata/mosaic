<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Mount Sinai

This demo shows an interactive dashboard of hospital prices listed by Mount Sinai in New York City. 

The red line is on the diagonal (`y = x`). The points represent the minimum and maximum charges for each procedure, medication, or treatment. 

If the price was the same for all patients, the points would be on the diagonal:

<Example spec="/specs/yaml/mount-sinai.yaml" />

The input menus and searchbox filter can help you see where there is the most discrepancy between the minimum and maximum negotiated rates. This discrepancy is what we help market makers such as large employers aim to reduce, which is a potential key performance indicator for our goal of reducing the price of health care. 

Mount Sinai's charges are pulled from here into our database: https://www.mountsinai.org/about/insurance/msh/price-transparency

(Direct download link: https://www.mountsinai.org/files/MSHealth/Assets/HS/131624096_mount-sinai-hospital_standardcharges.zip)


This is an initial prototype demonstrating the technical infrastructure that powers Payless Health, a project in development by the One Fact Foundation, a 501(c)(3) non-profit aiming to reduce the price of health care by building open source AI. 

## How this can help reduce the price of health care

We can help train your team to work with the 4,000+ [hospital price sheets we have collected](https://data.payless.health/#hospital_price_transparency/), for example to analyze health care claim feeds and identify opportunities to improve health outcomes while reducing the cost of care. 

Some of the folks we are lucky to work with have already saved $5-10 million dollars through such analyses, and we'd love to help you do the same. The process usually consists of standardizing a claim feed, linking it to our data, and then using our tools to identify opportunities to reduce the cost of care while improving health outcomes. For example, some folks we work with create incentives for employees such as ride-sharing credits to enable employees to access care at lower cost facilities that are cheaper and higher-quality for procedures that can be planned, such as certain elective surgeries.

## Feedback and collaboration! 

If you have any feedback, want to help build this, or suppport us with a tax-deductible contribution, please join our [chat](https://onefact.zulipchat.com/) or send us an email at [hello@onefact.org](mailto:hello@onefact.org) :)

We need all the help we can get to reduce the price of health care, and it can start from one fact, such as any one discrepancy between these maximum and minimum negotiated rates published by Mount Sinai. This demo builds on our first campaign in New York City highlighting the disparity in C section prices: https://www.onefact.org/images/five-boro-bike-tour/payless.health-linknyc-campaign.jpg