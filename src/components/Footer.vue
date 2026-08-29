<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-brand">
        <a class="navbar-brand" href="/">
          <img src="/logo-main.png" alt="logo">
        </a>
        <p class="footer-tagline">Honest reviews. Real ratings. Your next favorite K-drama or K-pop pick, sorted.</p>
      </div>
      <div class="footer-links">
        <h4 class="footer-heading">Quick Links</h4>
        <a class="footer-link" href="/">Home</a>
        <a class="footer-link" href="/workouts">My Reviews</a>
        <a class="footer-link" href="/profile">Profile</a>
        <a class="footer-link" href="/register">Register</a>
        <a class="footer-link" href="/login">Login</a>
      </div>
      <div class="footer-contact">
        <h4 class="footer-heading">Contact</h4>
        <p class="footer-text">support@rstjkreviews.com</p>
        <p class="footer-text">+63 900 000 0000</p>
        <div class="footer-socials">
          <a href="#" aria-label="Facebook">FB</a>
          <a href="#" aria-label="Instagram">IG</a>
          <a href="#" aria-label="Twitter">X</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 RSTJ K-Reviews. All rights reserved.</p>
    </div>
  </footer>
</template>

<script>
  export default {
    name: 'AppFooter'
  }
</script>

<style>
  .footer {
    background-color: #321E48;
    padding-top: 40px;
  }

  .footer .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 16px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 32px;
  }

  .footer-brand {
    flex: 1 1 260px;
  }

  .navbar-brand {
    display: flex;
    align-items: center;
    font-size: 20px;
    text-decoration: none;
  }

  .footer img {
    height: 80px;
  }

  .footer-tagline {
    font-family: 'Shanti', sans-serif;
    font-size: 14px;
    color: #D9FFF4;
    margin-top: 12px;
    max-width: 280px;
  }

  .footer-links,
  .footer-contact {
    flex: 1 1 160px;
    display: flex;
    flex-direction: column;
  }

  .footer-heading {
    font-family: 'Shanti', serif;
    font-size: 17px;
    color: #65DCD5;
    margin-bottom: 12px;
  }

  .footer-link {
    font-family: 'Shanti', sans-serif;
    font-size: 15px;
    color: #D9FFF4;
    text-decoration: none;
    margin-bottom: 8px;
    width: fit-content;
    position: relative;
    transition: color 0.2s ease;
  }

  .footer-link::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -2px;
    width: 0;
    height: 2px;
    background-color: #65DCD5;
    transition: width 0.2s ease;
  }

  .footer-link:hover {
    color: #65DCD5;
  }

  .footer-link:hover::after {
    width: 100%;
  }

  .footer-text {
    font-family: 'Shanti', sans-serif;
    font-size: 15px;
    color: #D9FFF4;
    margin-bottom: 8px;
  }

  .footer-socials {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }

  .footer-socials a {
    font-family: 'Shanti', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: #321E48;
    background-color: #65DCD5;
    text-decoration: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
  }

  .footer-socials a:hover {
    background-color: #D9FFF4;
    color: #321E48;
  }

  .footer-bottom {
    padding: 16px;
    text-align: center;
    background-color: #321E48;
  }

  .footer-bottom p {
    font-family: 'Shanti', sans-serif;
    font-size: 13px;
    color: #D9FFF4;
    margin: 0;
  }

  /* Medium screens: 2 columns (brand full width on top, links + contact side by side) */
  @media (max-width: 992px) {
    .footer {
      padding-top: 32px;
    }

    .footer .container {
      gap: 28px;
    }

    .footer-brand {
      flex: 1 1 100%;
    }

    .footer-links,
    .footer-contact {
      flex: 1 1 45%;
    }
  }

  /* Small screens: single column, everything stacked and centered */
  @media (max-width: 576px) {
    .footer {
      padding-top: 28px;
    }

    .footer .container {
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 28px;
    }

    .footer-brand,
    .footer-links,
    .footer-contact {
      flex: 1 1 100%;
      align-items: center;
    }

    .navbar-brand {
      justify-content: center;
    }

    .footer-tagline {
      max-width: 100%;
    }

    .footer-link {
      width: auto;
    }

    .footer-link::after {
      left: 50%;
      transform: translateX(-50%);
    }

    .footer-socials {
      justify-content: center;
    }

    .footer-bottom {
      padding: 14px;
    }

    .footer-bottom p {
      font-size: 12px;
    }
  }
</style>