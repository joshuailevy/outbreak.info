<template>
<div class="half-page my-5">
  <h1 class="mb-4">Uh oh. Page not found
  </h1>
  <img src="@/assets/monkey.svg" class="w-50" alt="Page not found" v-if="randomNum <= 0.33"/>
  <img src="@/assets/pirate.svg" class="w-50" alt="Page not found" v-else-if="randomNum >=0.67" />
  <img src="@/assets/fish.svg" class="w-50" alt="Page not found" v-else />


  <div class="d-flex w-100 justify-content-center">
    <div class="text-left text-muted my-5">
      <div class="mb-1">Return to:</div>
      <ul class="list-unstyled px-3 py-2 border-top border-bottom m-0">
        <li class="mb-2">
          <router-link :to="{name: 'Home'}">Home</router-link>
        </li>
        <li class="mb-2">
          <router-link :to="{name: 'Epidemiology'}">Cases &amp; Deaths</router-link>
        </li>
        <li class="mb-2">
          <router-link :to="{name: 'SituationReports'}">Variant Reports</router-link>
        </li>
        <li class="mb-2">
          <router-link :to="{name: 'Resource Summary'}">Research Library</router-link>
        </li>
      </ul>

    </div>
  </div>
</div>
</template>

<script>
import Vue from "vue";
export default {
  name: "PageNotFound",
  computed: {
    randomNum() {
      return(Math.random())
    }
  }
}
</script>
