<template>
<div :class="{'footer': isFooter}">
  <!-- Begin Mailchimp Signup Form -->
  <link href="//cdn-images.mailchimp.com/embedcode/slim-10_7.css" rel="stylesheet" type="text/css">
  <div id="mc_embed_signup">
    <form action="https://outbreak.us6.list-manage.com/subscribe/post?u=4e2de78c4d7538511404a841b&amp;id=103e6134e0" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_blank" novalidate>
      <div id="mc_embed_signup_scroll" class="p-0">
        <label for="mce-EMAIL">Receive email updates</label>
        <input type="email" value="" name="EMAIL" class="email" id="mce-EMAIL" placeholder="email address" required>
        <!-- real people should not fill this in and expect good things - do not remove this or risk form bot signups-->
        <div style="position: absolute; left: -5000px;" aria-hidden="true"><input type="text" name="b_4e2de78c4d7538511404a841b_103e6134e0" tabindex="-1" value=""></div>
        <div class="clear"><input type="submit" value="Subscribe" name="subscribe" id="mc-embedded-subscribe" class="button"></div>
      </div>
    </form>
  </div>
  <!--End mc_embed_signup-->
</div>
</template>

<script>
export default {
  name: "EmailSubscription",
  props: {
    isFooter: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="scss">
#mc-embedded-subscribe-form {
    padding: 0 !important;
    margin-top: 0.5rem;
    padding-top: 0.25rem !important;
    & label {
        font-family: $font-family !important;
        font-weight: 400 !important;
        padding: 0 !important;
        margin-bottom: 0.25rem !important;
        padding-top: 0.25rem !important;
    }
    & input {
        margin: 0.5rem 0 !important;
    }
}

.footer #mc-embedded-subscribe-form {
    color: rgba(255,255,255,.5) !important;
    border-top: 1px solid #dee2e6!important;
    & label {
        font-size: small !important;
    }
}
</style>
