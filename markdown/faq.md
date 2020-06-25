## I checked the site yesterday and it showed a different curve for my state, what’s going on?

First, note that we changed the model significantly on June 19th. See the question below: "Why did you change the model and why did values change?".

Otherwise, the reason historical values change is that we are not producing a single point each day, but rather a single curve. One of the constraints of the model is that this curve be connected and smooth. So, if new data suggests that R<sub>t</sub> should be higher, it will pull up previous values so that the newest point is connected. Imagine a rope laying on the ground. If you pick up the end of that rope, the rope needs to slope up to your hand. The same thing is roughly happening with the model. If all of a sudden a testing center releases far more tests than were expected, the R<sub>t</sub> curve increases which drags up previous values of R<sub>t</sub>. Since case data is staggered in its arrival, a bunch of new cases will sometimes rewrite its view of history given the new data. This is the most honest representation of the situation although it can feel disorienting if you don’t understand why it’s happening.


## If one state has a higher R<sub>t</sub> than another state, does that mean the situation is worse in the former vs. the latter?

Not necessarily. To assess the situation, you should take into account both R<sub>t</sub> and the absolute number of cases. A state with 1000 new cases a day and R<sub>t</sub> = 1.0 is likely in worse shape than a state with 10 new cases per day and R<sub>t</sub> = 1.1. The worse-case scenario is R<sub>t</sub> >> 1 and many new cases per day.

## My state has so few cases, why is R<sub>t</sub> so bad?

Even if there is only one person sick and that one person infects six people, R<sub>t</sub> will be 6.0. So to evaluate how bad a situation is for a given state, you need to understand both R<sub>t</sub>, but also the absolute number of cases. A high R<sub>t</sub> is manageable in the very short run as long as there are not many people sick to begin with. Smaller states like Vermont or Alaska often see this issue.

## What is the difference between "postives" and "test-adjusted positives"? Why don't the lines match up when I "show cases"?

Our model attempts to correct for testing volume. The dotted black line shows actual new cases reported, the blue line shows what the model believes actual cases would have been if you correct for testing volume. If today you tested 100 people and 10 came back positive and tomorrow you tested 500 people, you might assume you'd get 5x the number of postives back (all things being equal).

For instance, California shows a marked increase in cases over most of June, but the blue test-adjusted curve doesn't react nearly as much. This is because testing volume has ramped significantly in California in the same time period. If there are more tests, there will be more positives. The model works off the blue test-adjusted curve rather than the black dotted curve. Doing so ensures that we're looking at the 'true' trend in cases. That being said, tests are not a random sample of the population and therefore it's possible (and likely) that the selection of this group changes over time to include many more people who are not symptomatic and who are simply getting a test as a precaution. This means that if anything, the blue curve may be understating the true infections going forward. Please keep this in mind when drawing conclusions.

## Why did you change the model and why did values of R<sub>t</sub> change so much?

In many cases, R<sub>t</sub> stayed roughly in the same ballpark as the previous model. However, when it changed, it became far more accurate than the old model. The old model was a two stage model: one stage to de-noise the inbound cases, and another stage to calculate R<sub>t</sub>. It was also based on a simplification of epidemics known as the SEIR model. This model was fine, but the new model is far superior because it has fewer assumptions baked in, and is based on raw data rather than an SEIR model approximation. In other words, the more assumptions the old model had, the less certainty the inference had. In this new model there are fewer assumptions and therefore more certainty even if the values changed a bit.

## How does the new model work?

In the simplest terms, it searches for the most likely curve of R<sub>t</sub> that produced the new cases per day that we observe. It does this through some neat (and powerful!) math that is beyond the scope of this FAQ. In more complex terms: we assume a seed number of people and a curve of R<sub>t</sub> over the history of the pandemic, we then distribute those cases into the future using a known delay distribution between infection and positive report. We then scale and add noise based on known testing volumes via a negative binomial with an exposure parameter for a given day to recover an observed series. We plan on publishing our code soon, so if you’re so inclined you’ll be able to run it, too.

## My state has shown steadily increasing cases week over week, yet you show R<sub>t</sub> as fairly low, what’s going on?

A state that has increased testing rapidly will also show an increase in the number of cases each day because they are sampling a larger portion of the population. Our model corrects for increases in testing volume and therefore shows the ‘true’ R<sub>t</sub>.

## What are the red and green shaded bars above and below the value of R<sub>t</sub> in the top graph? And what are the colored red and green regions on the state graphs?

To understand these regions, you need to understand that the model is searching for the best R<sub>t</sub> curve of an infinite number of curves to explain the new case data that we are seeing. Of these infinitely many curves, there are some that are compatible with the data and others that are not. We show a single average curve, but the truth is that we’re not so confident that we can pick just one curve of all those curves. So, we show a range where we’re 80% sure the true curve lies. You'll notice this range is much larger in states with fewer cases. This happens because there are far more curves that can explain the small case counts than when case counts are large.

## How can test-adjusted positives be less than reported positives?

Test-adjusted positives are a relative measure of how many true positives there are, not an absolute measure. We cannot know the true number of positives because we don't know what % of the population is tested and what selection biases might exist in the group tested. Instead, we increase/decrease the reported number of postives based on the relative number of tests the occur each day. This is not perfect, but it is far better than using raw case counts.

## Why do you use positive tests instead of hospitalizations or deaths to inform your model? Aren't the latter two far more reliable?

In general, hospitalizations and deaths are more reliable than tests to see the true Rt curve. However, they are also both time-shifted fairly dramatically from the time of infection. As of this time we have not included them in our model, but we are considering ways to reliably and accurately include them to ensure the model is as accurate as possible.

## Do you plan on supporting more countries than the US? Would you ever do this for counties within states?

We'd love to support more countries and even counties. However, the availability of testing data is often limited and inconsistent in other places. While we have no immediate plans to expand coverage, we will continue to explore the quality and availability of the necessary data in other locales.

## Where is your data coming from?

We currently source both positive and total case counts from covidtracking.com. From their FAQ: "Almost all of the data we compile is taken directly from the websites of state/territory public health authorities."

## I see a problem, bug, issue with your site, data or model. Can I tell you about it?

Yes please! [hello@rt.live](mailto:hello@rt.live) – please note that due to an enormous number of emails each day we are unable to respond to each of them, but we will do our best to address issues raised.

## Who are you folks?

Kevin Systrom and Mike Krieger are the co-founders of Instagram. Tom Vladeck is a data scientist and owner of Gradient Metrics. This projects is not affiliated with with either Instagram or Gradient Metrics.

## Why did you create this site?

This site is a public good. We have no intention of commercializing the site or the output of the site. Instead, we believe the public and policymakers alike should have free access to inform their decisions. More importantly, when we started this site, we believed that a series of interventions and relaxations of those interventions at a state level would cause traditional models to struggle to explain the situation. Instead, we focused on providing a real-time view into the best guess for Rt, which we believe is the best metric to understand the relative growth or decline of the virus.

## May I display your data elsewhere? (eg. my site, publication, etc)

Yes, we just ask that you cite Rt.live as the source and link where appropriate.'

## Where can I find the source code to your model?

It's located [here](https://github.com/rtcovidlive/covid-model).

# Known Issues

While we believe our model is very strong, all models have limitations because they reduce a complex reality into a simple system. You should be aware of the following limitations of this model when interpreting the results:
- Our model relies upon valid data from COVIDTracking.com, and they in turn rely on states to provide timely and accurate data as well. Unfortunately, data can be noisy, incorrect, delayed, and otherwise wrong. While on average, we believe the data to be correct, there are times when an errant datapoint throws the model off. Please let us know if you see an instance of this.
- Our model attempts to correct for testing by looking at what is essentially the positivity rate. This positivity rate changes over time because the group of people tested changes. If anything, our model may understate R<sub>t</sub> currently because far more people without symptoms are tested, thus driving the positive percentage down and overstating a downward trend in cases.
- Our model relies upon a distribution for the delay between infection and reported positive test. Most of the data used to generate this distribution is from Germany and a handful of other countries – it is quite possible this delay distribution may look very different in the US and state by state.
