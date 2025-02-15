<template>
<div class="d-flex flex-column align-items-center w-100" id="location-report-prevalence">
  <!-- zoom btns -->
  <div class="d-flex justify-content-end px-3" :style="{width: width + 'px'}">
    <button class="btn btn-accent-flat text-highlight d-flex align-items-center m-0 p-2" @click="enableZoom">
      <font-awesome-icon class="text-right" :icon="['fas', 'search-plus']" />
    </button>
    <button class="btn btn-accent-flat text-highlight d-flex align-items-center m-0 p-2" @click="resetZoom">
      <font-awesome-icon class="text-right" :icon="['fas', 'compress-arrows-alt']" />
    </button>
  </div>

  <div class="d-flex flex-column">
    <!-- SVGs -->
    <div class="d-flex flex-column align-items-start">
      <!-- TIME TRACE -->
      <div class="d-flex w-100 justify-content-between">
        <h5 class="p-0 m-0">{{title}}</h5>
        <div>
          <label class="b-contain m-auto pr-3">
            <small>show confidence intervals</small>
            <input type="checkbox" v-model="showCI" :value="showCI" @change="hideCIs" />
            <div class="b-input"></div>
          </label>
        </div>
      </div>

      <div class="d-flex">
        <svg width="15" height="15" class="mr-2">
          <line x1="0" x2="15" y1="8" y2="8" class="trace-legend"></line>
        </svg>
        <small class="text-muted">7 day rolling average of percent sequences with mutation(s)</small>
      </div>

      <!-- legend: confidence interval -->
      <div class="d-flex">
        <div class="ci-legend mr-2" :style="{background: '#999'}">
        </div>
        <small class="text-muted">95% confidence interval</small>
        <svg width="15" height="15" class="ml-4 mr-2">
          <rect x="0" y="0" :width="15" :height="15" fill="url(#diagonalHatchLight)"></rect>
        </svg>
        <small class="text-muted">missing recent data</small>
      </div>

      <svg :width="width" :height="height" class="mutation-epi-prevalence" ref="svg" :name="title">
        <defs>
          <marker id="arrow" markerWidth="13" markerHeight="10" refX="10" refY="5" orient="auto" markerUnits="strokeWidth" stroke="#929292" fill="none">
            <path d="M5,0 L12,5 L5,10" class="swoopy-arrowhead" />
          </marker>

          <pattern id="diagonalHatchLight" width="7" height="7" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <rect x="-2" y="-2" width="10" height="10" fill="#efefef" />
            <line x1="0" y1="0" x2="0" y2="25" :style="`stroke:#CCC; stroke-width:4`" />
          </pattern>
        </defs>

        <g :transform="`translate(${margin.left}, ${height - margin.bottom })`" class="mutation-axis axis--x" ref="xAxis"></g>
        <g :transform="`translate(${margin.left}, ${margin.top})`" class="mutation-axis axis--y" ref="yAxis"></g>
        <g ref="chart" :transform="`translate(${margin.left}, ${margin.top})`"></g>
        <g ref="brush2" class="brush" id="brush2-zoom" :transform="`translate(${margin.left},${margin.top})`" v-if="data" :class="{hidden: !zoomAllowed}"></g>
        <g id="no-data" v-if="noData">
          <text font-size="24px" fill="#888888" :x="width/2" :y="height/2 - margin.top" dominant-baseline="middle" text-anchor="middle">No sequences found</text>
        </g>
        <!-- <g id="no-data" v-if="data.length < lengthThreshold && data.length">
          <text font-size="24px" fill="#888888" :x="width/2" :y="height/2 - margin.top" dominant-baseline="middle" text-anchor="middle">Two points may make a line, but it's not very informative.</text>
          <text font-size="24px" fill="#888888" transform="translate(0, 28)" :x="width/2" :y="height/2 - margin.top" dominant-baseline="middle" text-anchor="middle">{{location}} only has {{data.length}} {{data.length === 1 ? "date" : "dates"}} with
            sequencing data</text>
        </g> -->
        <g id="weird-last values" :hidden="data && data.length < lengthThreshold">
          <text :x="width - margin.right" :y="0" fill="#929292" font-size="14px" dominant-baseline="hanging" text-anchor="end" :style="`font-family: ${fontFamily};`">Latest dates are noisy due to fewer samples, or missing from sequencing
            delays</text>
          <path stroke="#BBBBBB" fill="none" :d="`M ${width - margin.right - 75} 20 c 10 10, 20 20, 50 20`" marker-end="url(#arrow)"></path>
        </g>
      </svg>

      <!-- Histogram of sequencing counts -->
      <SequencingHistogram :data="seqCounts" :xInput="x" :width="width" :svgTitle="title" :margin="marginHist" :mutationName="mutationName" :onlyTotals="onlyTotals" notDetectedColor="#bab0ab" detectedColor="#79706E"
        className="mutation-epi-prevalence" v-if="seqCounts && seqCounts.length" />

      <!-- zoom btns -->
      <div class="d-flex justify-content-end px-3" :style="{width: width + 'px'}" :class="{'hidden' : !epi.length}">
        <button class="btn btn-accent-flat text-highlight d-flex align-items-center m-0 p-2" @click="enableZoom">
          <font-awesome-icon class="text-right" :icon="['fas', 'search-plus']" />
        </button>
        <button class="btn btn-accent-flat text-highlight d-flex align-items-center m-0 p-2" @click="resetZoom">
          <font-awesome-icon class="text-right" :icon="['fas', 'compress-arrows-alt']" />
        </button>
      </div>

      <!-- EPI TRACE -->
      <div :class="{'hidden' : !epi.length}">
        <h5 class="">Daily COVID-19 cases in <router-link :to="{name:'Epidemiology', query:{location: locationID}}">{{ locationName }}</router-link>
        </h5>
        <div class="d-flex">
          <svg width="15" height="15" class="mr-2">
            <line x1="0" x2="15" y1="8" y2="8" class="trace-legend"></line>
          </svg>
          <small class="text-muted">7 day rolling average of confirmed cases</small>
          <svg width="15" height="15" class="ml-4 mr-2">
            <rect x="0" y="0" :width="15" :height="15" fill="url(#diagonalHatchLight)"></rect>
          </svg>
          <small class="text-muted">missing recent data</small>
        </div>

        <svg :width="width" :height="epiHeight" class="mutation-epi-prevalence" ref="epi" :name="title">
          <g :transform="`translate(${margin.left}, ${epiHeight - margin.bottom })`" class="epi-axis epi-x axis--x" ref="xEpiAxis"></g>
          <g :transform="`translate(${margin.left}, ${margin.top})`" class="epi-axis epi-y axis--y" ref="yEpiAxis"></g>
          <g ref="epiChart" :transform="`translate(${margin.left}, ${margin.top})`"></g>
          <g ref="brush" class="brush" id="brush-zoom" :transform="`translate(${margin.left},${margin.top})`" v-if="data" :class="{hidden: !zoomAllowed}"></g>
        </svg>
      </div>

    </div>
  </div>

  <!-- TOOLTIPS -->
  <div ref="tooltip_mutations" class="tooltip-basic box-shadow" id="tooltip-mutations">
    <h5 id="mutation" class="p-2 m-0"></h5>
    <small id="sublineages" class="line-height-sm"></small>
  </div>
  <!-- <div ref="tooltip_prevalence" class="tooltip-basic box-shadow" id="tooltip-prevalence">
    <h5 id="date"></h5>
    <div class="d-flex align-items-center">
      <b id="proportion" class="font-size-2"></b>
      <span id="confidence-interval" class="text-muted ml-2"></span>
    </div>

    <div id="sequencing-count"></div>
    <div id="sequencing-count-rolling"></div>
  </div> -->

  <DownloadReportData :data="data" figureRef="mutation-epi-prevalence" :isVertical="true" dataType="Mutation Report Prevalence over Time" />

</div>
</template>

<script lang="js">
import Vue from "vue";
import {
  select,
  selectAll,
  scaleLinear,
  scaleTime,
  scaleOrdinal,
  axisBottom,
  axisLeft,
  axisRight,
  extent,
  map,
  brushX,
  forceCollide,
  forceY,
  forceSimulation,
  event,
  max,
  format,
  timeFormat,
  timeParse,
  line,
  area,
  transition,
  timeDay
} from "d3";

import cloneDeep from "lodash/cloneDeep";

import DownloadReportData from "@/components/DownloadReportData.vue";
import SequencingHistogram from "@/components/SequencingHistogram.vue";

// --- font awesome --
import {
  FontAwesomeIcon
} from "@fortawesome/vue-fontawesome";
import {
  library
} from "@fortawesome/fontawesome-svg-core";
import {
  faSearchPlus,
  faCompressArrowsAlt
} from "@fortawesome/free-solid-svg-icons/";

library.add(faSearchPlus, faCompressArrowsAlt);

export default Vue.extend({
  name: "ReportPrevalence",
  props: {
    data: Array,
    seqCounts: Array,
    epi: Array,
    locationName: String,
    locationID: String,
    setWidth: Number,
    xmin: String,
    xmax: String,
    setColorScale: Function,
    mutationName: String,
    includeToday: {
      type: Boolean,
      default: true
    },
    routeName: {
      type: String,
      default: "LocationReport"
    },
    onlyTotals: {
      type: Boolean,
      default: true
    }
  },
  components: {
    DownloadReportData,
    SequencingHistogram,
    FontAwesomeIcon
  },
  computed: {
    noData() {
      return (this.data.flatMap(d => d.data).length === 0)
    },
    title() {
      return (this.locationName == "Worldwide" ? `Mutation and case prevalence over time worldwide` : `Mutation and case prevalence over time in ${this.locationName}`)
    },
    countTitle() {
      return (`Total samples sequenced by collection date in ${this.location}`)
    }
  },
  data() {
    return {
      width: 800,
      height: 400,
      epiHeight: 300,
      margin: {
        top: 15,
        bottom: 25,
        left: 85,
        right: 135
      },
      marginHist: {
        top: 7,
        bottom: 7,
        left: 85,
        right: 110
      },
      heightCounts: 80,
      lengthThreshold: 1,
      showDetected: null,
      detectedDisplayThresh: 50,
      showCI: true,
      fontFamily: "'DM Sans', Avenir, Helvetica, Arial, sans-serif;",
      // variables
      xVariable: "dateTime",
      fillVariable: "label",
      xEpiVariable: "date",
      yVariable: "proportion",
      yEpiVariable: "confirmed_rolling",
      totalVariable: "total_count",
      // axes
      x: scaleTime(),
      y: scaleLinear(),
      yEpi: scaleLinear(),
      yCounts: scaleLinear(),
      colorScale: scaleOrdinal(["#4E79A7", // dk blue
        "#f28e2b", // orange
        "#59a14f", // green
        "#e15759", // red
        "#499894", // teal
        "#F1CE63", // yellow
        "#D37295", // dk pink
        "#B07AA1", // dk purple
        "#9D7660", // brown
        "#bcbd22", // puce,
        "#79706E",
        "#aecBe8", // lt blue
        "#FFBE7D", // lt. orange
        "#8CD17D", // lt. green
        "#FF9D9A", // lt. red
        "#86BCB6", // lt. teal
        "#B6992D", // dk yellow
        "#FABFD2", // lt. pink,
        "#D4A6C8", // lt. purple
        "#D7B5A6" // lt. brown
      ]),
      maxCounts: null,
      xBandwidth: 1,
      xMin: null,
      xMax: null,
      maxDate: null,
      maxEpiDate: null,
      today: null,
      xAxis: null,
      yAxis: null,
      yEpiAxis: null,
      yCountsAxisLeft: null,
      yCountsAxisRight: null,
      numXTicks: 5,
      numYTicks: 6,
      zoomAllowed: false,
      plottedData: null,
      plottedEpi: null,
      // methods
      line: null,
      epiLine: null,
      area: null,
      brush: null,
      // refs
      chart: null,
      epiChart: null,
      counts: null,
      brushRef: null,
      brush2Ref: null
    }
  },
  watch: {
    width: function() {
      this.setXScale();
      this.updateBrush();
      this.updatePlot();
    },
    data: function() {
      this.xMin = timeParse("%Y-%m-%d")(this.xmin);
      this.xMax = timeParse("%Y-%m-%d")(this.xmax);
      this.setXScale();
      this.updatePlot();
    },
    xmin: function() {
      this.xMin = timeParse("%Y-%m-%d")(this.xmin);
      this.xMax = timeParse("%Y-%m-%d")(this.xmax);
      this.setXScale();
      this.updatePlot();
    },
    xmax: function() {
      this.xMin = timeParse("%Y-%m-%d")(this.xmin);
      this.xMax = timeParse("%Y-%m-%d")(this.xmax);
      this.setXScale();
      this.updatePlot();
    }
  },
  mounted() {
    this.$nextTick(function() {
      if (!this.setWidth) {
        window.addEventListener("resize", this.debounceSetDims);
      }
      this.updateBrush();
    })

    // set initial dimensions for the plots.
    this.setDims();
    this.setupPlot();
    this.updatePlot();
  },
  created: function() {
    this.debounceSetDims = this.debounce(this.setDims, 150);
    this.debounceZoom = this.debounce(this.zoom, 150);
  },
  methods: {
    updateBrush() {
      // Update brush so it spans the whole of the area
      this.brush = brushX()
        .extent([
          [0, 0],
          [this.width - this.margin.left - this.margin.right, this.height - this.margin.top - this.margin.bottom]
        ])
        .on("end", () => this.debounceZoom(event));

      this.brushRef
        .call(this.brush)
        .on("dblclick", this.resetZoom);

      this.brushRef2
        .call(this.brush)
        .on("dblclick", this.resetZoom);
    },
    setDims() {
      const mx = 0.85;
      const my = 0.4;
      const hwRatio = 0.4;
      if (!this.setWidth) {
        const svgContainer = document.getElementById('location-report-prevalence');

        let maxWidth = svgContainer ? svgContainer.offsetWidth : 800;
        maxWidth = maxWidth < 500 ? maxWidth * 0.98 : maxWidth * mx;
        const maxHeight = window.innerHeight * my;


        const idealHeight = hwRatio * maxWidth;
        if (idealHeight <= maxHeight) {
          this.height = idealHeight;
          this.width = maxWidth;
        } else {
          this.height = maxHeight;
          this.width = this.height / hwRatio;
        }
      } else {
        this.width = this.setWidth;
        this.height = hwRatio * this.width;
      }

      if (this.width < 600) {
        this.numXTicks = 2;
        this.numYTicks = 4;
      } else {
        this.numXTicks = 6;
        this.numYTicks = 5;
      }
    },
    zoom(evt, ref) {
      // reset domain to new coords
      const selection = this.event.selection;

      if (selection) {
        const newMin = this.x.invert(selection[0]);
        const newMax = this.x.invert(selection[1]);

        this.x = scaleTime()
          .range([0, this.width - this.margin.left - this.margin.right])
          .domain([newMin, newMax])
          .clamp(true);

        // update plotted data
        this.plottedData = cloneDeep(this.data);
        this.plottedData.forEach(mutation => {
          mutation.data = mutation.data.filter(d => d[this.xVariable] >= newMin && d[this.xVariable] <= newMax);
        });

        this.plottedData = this.plottedData.filter(d => d.data.length);
        this.plottedEpi = this.epi.filter(d => d[this.xEpiVariable] >= newMin && d[this.xEpiVariable] <= newMax);
        // move the brush
        this.brushRef.call(this.brush.move, null);
        this.brushRef2.call(this.brush.move, null);
        this.zoomAllowed = false;
        this.updatePlot();


        // update route
        const queryParams = this.$route.query;

        if (this.routeName == "MutationReport") {
          const params = this.$route.params;
          this.$router.push({
            name: this.routeName,
            params: {
              disableScroll: true,
              alias: params.alias
            },
            query: {
              xmin: timeFormat("%Y-%m-%d")(newMin),
              xmax: timeFormat("%Y-%m-%d")(newMax),
              loc: queryParams.loc,
              muts: queryParams.muts,
              pango: queryParams.pango,
              selected: queryParams.selected
            }
          })
        } else if (this.routeName == "GenomicsEmbedVariant") {
          const params = this.$route.params;
          this.$router.push({
            name: "GenomicsEmbed",
            params: {
              disableScroll: true
            },
            query: {
              type: "var",
              alias: queryParams.alias,
              xmin: timeFormat("%Y-%m-%d")(newMin),
              xmax: timeFormat("%Y-%m-%d")(newMax),
              loc: queryParams.loc,
              muts: queryParams.muts,
              pango: queryParams.pango,
              selected: queryParams.selected
            }
          })
        } else if (this.routeName == "LocationReport") {
          this.$router.push({
            name: "LocationReport",
            params: {
              disableScroll: true
            },
            query: {
              loc: queryParams.loc,
              muts: queryParams.muts,
              alias: queryParams.alias,
              pango: queryParams.pango,
              variant: queryParams.variant,
              selected: queryParams.selected,
              xmin: timeFormat("%Y-%m-%d")(newMin),
              xmax: timeFormat("%Y-%m-%d")(newMax)
            }
          })
        } else if (this.routeName == "GenomicsEmbedLocation") {
          this.$router.push({
            name: "GenomicsEmbed",
            params: {
              disableScroll: true
            },
            query: {
              type: "loc",
              loc: queryParams.loc,
              muts: queryParams.muts,
              alias: queryParams.alias,
              pango: queryParams.pango,
              variant: queryParams.variant,
              selected: queryParams.selected,
              xmin: timeFormat("%Y-%m-%d")(newMin),
              xmax: timeFormat("%Y-%m-%d")(newMax)
            }
          })
        }
      }
    },
    resetZoom() {
      this.brushRef.call(this.brush.move, null);
      this.brushRef2.call(this.brush.move, null);
      const queryParams = this.$route.query;

      this.xMin = null;
      this.xMax = null;
      this.setXScale();

      if (this.routeName == "MutationReport") {
        const params = this.$route.params;
        this.$router.push({
          name: this.routeName,
          params: {
            disableScroll: true,
            alias: params.alias
          },
          query: {
            loc: queryParams.loc,
            muts: queryParams.muts,
            pango: queryParams.pango,
            selected: queryParams.selected
          }
        })
      }
      if (this.routeName == "LocationReport") {
        this.$router.push({
          name: "LocationReport",
          params: {
            disableScroll: true
          },
          query: {
            loc: queryParams.loc,
            muts: queryParams.muts,
            alias: queryParams.alias,
            pango: queryParams.pango,
            variant: queryParams.variant,
            selected: queryParams.selected
          }
        })
      }

      this.updatePlot();
    },
    enableZoom() {
      this.zoomAllowed = true;
    },
    setupPlot() {
      this.xMin = timeParse("%Y-%m-%d")(this.xmin);
      this.xMax = timeParse("%Y-%m-%d")(this.xmax);
      this.svg = select(this.$refs.svg);
      this.chart = select(this.$refs.chart);
      this.counts = select(this.$refs.counts);
      this.epiChart = select(this.$refs.epiChart);
      this.brushRef = select(this.$refs.brush);
      this.brushRef2 = select(this.$refs.brush2);

      // estimate
      this.line = line()
        .x(d => this.x(d[this.xVariable]))
        .y(d => this.y(d[this.yVariable]));

      // epi trace
      this.epiLine = line()
        .x(d => this.x(d["date"]))
        .y(d => this.yEpi(d[this.yEpiVariable]));

      // confidence interval area method
      this.area = area()
        .x(d => this.x(d[this.xVariable]))
        .y0(d => this.y(d.proportion_ci_lower))
        .y1(d => this.y(d.proportion_ci_upper));

      this.setXScale();
    },
    setXScale() {
      let xDomain;

      if (this.xMin && this.xMax && this.xMin < this.xMax) {
        xDomain = [this.xMin, this.xMax];
      } else {

        const mutExtent = extent(this.data.flatMap(d => d.data).map(d => d[this.xVariable]));
        let minDate;
        if (this.epi && this.epi.length) {
          const epiExtent = extent(this.epi.map(d => d[this.xEpiVariable]));
          this.maxDate = mutExtent[1];
          this.maxEpiDate = epiExtent[1]
          minDate = Math.min(epiExtent[0], mutExtent[0]);
        } else {
          this.maxDate = mutExtent[1];
          minDate = mutExtent[0];
        }

        if (this.includeToday) {
          this.today = new Date();
          xDomain = [minDate, this.today];
        } else {
          xDomain = [minDate, math.Max(this.maxDate, this.maxEpiDate)];
        }

        if (this.xMin && this.xMin < xDomain[1]) {
          xDomain[0] = this.xMin;
        }

        if (this.xMax && this.xMax > xDomain[0]) {
          xDomain[1] = this.xMax;
        }
      }

      this.x = scaleTime()
        .range([0, this.width - this.margin.left - this.margin.right])
        .domain(xDomain)
        .clamp(true);

      this.plottedData = cloneDeep(this.data);
      this.plottedEpi = this.epi;
      this.plottedData.forEach(mutation => {
        mutation.data = mutation.data.filter(d => d[this.xVariable] >= xDomain[0] && d[this.xVariable] <= xDomain[1]);
      });

      this.plottedData = this.plottedData.filter(d => d.data.length);
      this.plottedEpi = this.epi.filter(d => d[this.xEpiVariable] >= xDomain[0] && d[this.xEpiVariable] <= xDomain[1]);

      this.colorScale = this.setColorScale ? this.setColorScale : this.colorScale.domain(map(this.data, d => d[this.fillVariable]));
    },
    updateScales() {
      const avgMax = max(this.plottedData.flatMap(d => d.data), d => d[this.yVariable]);
      const CIMax = max(this.plottedData.flatMap(d => d.data), d => d.proportion_ci_upper);

      this.y = this.y
        .range([this.height - this.margin.top - this.margin.bottom, 0])
        .nice()
        .domain([0, (avgMax + CIMax) * 0.5]);

      this.yEpi = scaleLinear()
        .range([this.epiHeight - this.margin.top - this.margin.bottom, 0])
        .domain([0, max(this.plottedEpi, d => d[this.yEpiVariable])])
        .nice();

      this.xAxis = axisBottom(this.x)
        .ticks(this.numXTicks)
        .tickSize(-this.height)
        .tickSizeOuter(0);

      select(this.$refs.xAxis).call(this.xAxis);
      select(this.$refs.xEpiAxis).call(this.xAxis);

      const yTickFormat = this.y.domain()[1] < 0.02 ? ".1%" : ".0%";

      this.yAxis = axisLeft(this.y).tickSizeOuter(0)
        .ticks(this.numYTicks)
        .tickFormat(format(yTickFormat));

      this.yEpiAxis = axisLeft(this.yEpi).tickSizeOuter(0)
        .ticks(this.numYTicks);

      select(this.$refs.yAxis).call(this.yAxis);
      select(this.$refs.yEpiAxis).call(this.yEpiAxis);
    },
    hideCIs() {
      this.chart
        .selectAll(".confidence-interval")
        .classed("hidden", !this.showCI);
    },
    tooltipOn() {
      // const ttipShift = 20;
      //
      // // find closest date
      // const selectedX = this.x.invert(event.offsetX - this.margin.left);
      // const selectedDate = timeDay.round(selectedX);
      // const selected = this.data.filter(d => Math.abs(d.dateTime - selectedDate) < 1e-12);
      //
      // if (selected.length) {
      //   // tooltip on
      //   const ttip = select(this.$refs.tooltip_prevalence);
      //
      //   // edit text
      //   ttip.select("h5").text(selected[0].date)
      //
      //   ttip.select("#proportion").text(format(".0%")(selected[0].proportion))
      //   ttip.select("#confidence-interval").text(`(95% CI: ${format(".0%")(selected[0].proportion_ci_lower)}-${format(".0%")(selected[0].proportion_ci_upper)})`)
      //   ttip.select("#sequencing-count").text(`Number of cases: ${format(",")(selected[0].lineage_count)}/${format(",")(selected[0].total_count)}`)
      //   ttip.select("#sequencing-count-rolling").text(`Rolling average: ${format(",.1f")(selected[0].lineage_count_rolling)}/${format(",.1f")(selected[0].total_count_rolling)}`)
      //
      //   // fix location
      //   ttip
      //     .style("left", `${event.clientX + ttipShift}px`)
      //     .style("top", `${event.clientY + ttipShift}px`)
      //     .style("display", "block");
      //
      //   // histogram off/on
      //   selectAll(".raw-counts")
      //     .style("opacity", 0.3);
      //
      //   selectAll(`#date${selected[0].date}`)
      //     .style("opacity", 1);
      // }
    },
    tooltipOff() {
      select(this.$refs.tooltip_mutations)
        .style("display", "none");

      this.chart.selectAll(".mutation-trace")
        .style("opacity", 1);

      selectAll(".raw-counts")
        .style("opacity", 1);
    },
    tooltipOnMutation(d) {
      const ttipShift = 20;
      const ttip = select(this.$refs.tooltip_mutations);

      // dim all
      this.chart.selectAll(".mutation-trace")
        .style("opacity", 0.3);

      this.chart.select(`#${d.id}`)
        .style("opacity", 1);


      // edit text
      ttip.select("h5")
        .text(d.label)
        .style("color", this.colorScale(d.label))

      ttip.select("#sublineages")
        .text(d.pango_descendants ? d.pango_descendants.join(", ") : "")
        .style("color", this.colorScale(d.label))

      // fix location
      ttip
        .style("left", `${event.clientX + ttipShift}px`)
        .style("top", `${event.clientY + ttipShift}px`)
        .style("display", "block");
    },
    tooltipOffMutation() {
      this.chart.selectAll(".mutation-trace")
        .style("opacity", 1);

      select(this.$refs.tooltip_mutations)
        .style("display", "none");
    },
    updatePlot() {
      const t1 = transition().duration(1500);

      if (this.plottedData && this.plottedEpi) {
        this.updateScales();

        // EPI DATA
        // hashed area to highlight the gap between today
        if (this.includeToday) {
          const noDataSelectorEpi = this.epiChart
            .selectAll(".no-data-epi")
            .data([0]);

          noDataSelectorEpi.join(
            enter => {
              enter.append("rect")
                .attr("class", "no-data-epi")
                .attr("x", this.x(this.maxEpiDate))
                .attr("width", this.x(this.today) - this.x(this.maxEpiDate))
                .attr("height", this.epiHeight - this.margin.top - this.margin.bottom)
                .style("fill", "url(#diagonalHatchLight)")
            },
            update => {
              update
                .attr("height", this.epiHeight - this.margin.top - this.margin.bottom)
                .style("fill", "url(#diagonalHatchLight)")
                .attr("x", this.x(this.maxEpiDate))
                .attr("width", this.x(this.today) - this.x(this.maxEpiDate))
            },
            exit =>
            exit.call(exit =>
              exit
              .transition()
              .style("opacity", 1e-5)
              .remove()
            )
          )
        }

        const epiSelector = this.epiChart
          .selectAll(".epi-curve")
          .data([this.plottedEpi]);

        epiSelector.join(enter => {
            enter.append("path")
              .attr("class", "epi-curve")
              .attr("d", this.epiLine)
              .style("fill", "none")
              .style("stroke", "#333333")
              .style("stroke-width", 1.75);
          },
          update => {
            update
              .attr("d", this.epiLine)
          },
          exit =>
          exit.call(exit =>
            exit
            .transition()
            .style("opacity", 1e-5)
            .style("opacity", 1e-5)
            .remove()
          )
        )

        // MUTATION TRACES
        // hashed area to highlight the gap between today
        if (this.includeToday) {
          const noDataSelector = this.chart
            .selectAll(".no-data")
            .data([0]);

          noDataSelector.join(
            enter => {
              enter.append("rect")
                .attr("class", "no-data")
                .attr("x", this.x(this.maxDate))
                .attr("width", this.x(this.today) - this.x(this.maxDate))
                .attr("height", this.height - this.margin.top - this.margin.bottom)
                .style("fill", "url(#diagonalHatchLight)")
            },
            update => {
              update
                .attr("height", this.height - this.margin.top - this.margin.bottom)
                .style("fill", "url(#diagonalHatchLight)")
                .attr("x", this.x(this.maxDate))
                .attr("width", this.x(this.today) - this.x(this.maxDate))
            },
            exit =>
            exit.call(exit =>
              exit
              .transition()
              .style("opacity", 1e-5)
              .remove()
            )
          )
        }

        // calculate the end point labels
        // Create nodes of the text labels for force direction
        const labelHeight = 18;
        const endLabels = this.plottedData.map(d => {
          return ({
            label: d[this.fillVariable],
            id: d.id,
            pango_descendants: d.pango_descendants,
            route: d.route,
            params: d.params,
            fx: 0,
            targetY: this.y(d.data.slice(-1)[0][this.yVariable])
          })
        })

        // Define a custom force
        const forceClamp = (min, max) => {
          let nodes;
          const force = () => {
            nodes.forEach(n => {
              if (n.y > max) n.y = max;
              if (n.y < min) n.y = min;
            });
          };
          force.initialize = _ => (nodes = _);
          return force;
        };

        // Set up the force simulation
        const force = forceSimulation()
          .nodes(endLabels)
          .force("collide", forceCollide(labelHeight / 2).strength(1))
          .force("y", forceY(d => d.targetY).strength(1))
          .force(
            "clamp",
            forceClamp(0, this.height - this.margin.top - this.margin.bottom)
          )
          .stop();

        // Execute the simulation
        for (let i = 0; i < 300; i++) force.tick();

        const labelSelector = this.chart.selectAll(".mutation-label")
          .data(endLabels);

        labelSelector.join(
          enter => {
            enter
              .append("text")
              .attr("class", "mutation-label pointer")
              .attr("x", this.width - this.margin.left - this.margin.right)
              .attr("dx", 5)
              .attr("y", d => d.y)
              .style("font-size", 22)
              .style("font-family", "'DM Sans', Avenir, Helvetica, Arial, sans-serif")
              .style("fill", d => this.colorScale(d.label))
              .text(d => d.label);
          },
          update => {
            update
              .attr("x", this.width - this.margin.left - this.margin.right)
              .attr("y", d => d.y)
              .style("fill", d => this.colorScale(d.label))
              .text(d => d.label)
          },
          exit =>
          exit.call(exit =>
            exit
            .transition()
            .style("opacity", 1e-5)
            .remove()
          )
        )

        this.chart
          .selectAll(".mutation-label")
          .on("mouseover", d => this.tooltipOnMutation(d))
          .on("mouseout", () => this.tooltipOffMutation())
          .on("click", d => this.route2Mutation(d));

        const mutSelector = this.chart
          .selectAll(".mutation-trace")
          .data(this.plottedData);


        mutSelector.join(
          enter => {
            const mutGrp = enter.append("g")
              .attr("class", "mutation-trace")
              .attr("id", d => d.id);

            mutGrp.append("path")
              .attr("class", "confidence-interval")
              .style("fill", d => this.colorScale(d[this.fillVariable]))
              .style("fill-opacity", 0.2)
              .attr("d", d => this.area(d.data))
              .classed("hidden", !this.showCI);

            mutGrp.append("path")
              .attr("class", "prevalence-line pointer")
              .style("stroke", d => this.colorScale(d[this.fillVariable]))
              .style("fill", "none")
              .style("stroke-width", "2.5")
              .attr("d", d => this.line(d.data))
          },
          update => {
            update
              .attr("id", d => d.id);

            update.select(".confidence-interval")
              .style("fill", d => this.colorScale(d[this.fillVariable]))
              .attr("d", d => this.area(d.data))
              .classed("hidden", !this.showCI);

            update.select(".prevalence-line")
              .style("stroke", d => this.colorScale(d[this.fillVariable]))
              .style("fill", "none")
              .style("stroke-width", "2.5")
              .attr("d", d => this.line(d.data))
          },
          exit =>
          exit.call(exit =>
            exit
            .transition()
            .style("opacity", 1e-5)
            .remove()
          )
        )

        // event listener for tooltips
        this.chart.selectAll(".mutation-trace")
          .on("mousemove", d => this.tooltipOnMutation(d))
          .on("mouseleave", () => this.tooltipOff())
          .on("click", d => this.route2Mutation(d));

        this.counts.selectAll(".raw-counts")
          .on("mousemove", d => this.tooltipOnMutation(d))
          .on("mouseleave", () => this.tooltipOff())
      }
    },
    route2Mutation(d) {
      const params = d.params ? d.params : {};
      if (this.routeName.includes("GenomicsEmbed")) {
        const pango = params.alias ? null : d.label;
        this.$router.push({
          name: "GenomicsEmbed",
          params: params,
          query: {
            alias: params.alias,
            type: "var",
            pango: pango,
            loc: this.locationID,
            selected: this.locationID
          }
        })
      } else {
        this.$router.push({
          name: "MutationReport",
          params: params,
          query: {
            pango: d.label,
            loc: this.locationID,
            selected: this.locationID
          }
        })
      }
    },
    debounce(fn, delay) {
      var timer = null;
      return function() {
        var context = this,
          args = arguments,
          evt = event;
        //we get the D3 event here
        clearTimeout(timer);
        timer = setTimeout(function() {
          context.event = evt;
          //and use the reference here
          fn.apply(context, args);
        }, delay);
      };
    }
  }
})
</script>

<style lang="scss">
#location-report-prevalence {
    & .count-axis,
    & .mutation-axis {
        font-size: 16pt;
        text {
            fill: $grey-90;
        }
    }

    & .epi-y {
        font-size: 14pt;
    }

    & .epi-x {
        font-size: 16pt;
    }

    & .axis--y text {
        font-size: 12pt;
    }

    & .mutation-axis.axis--y text {
        font-size: 16pt;
    }

    & .axis--x line {
        stroke: #555;
        stroke-width: 0.25;
    }
}

.ci-legend {
    width: 15px;
    height: 15px;
    opacity: 0.3;
}

.trace-legend {
    stroke: #777;
    stroke-width: 2.5;
}
</style>
