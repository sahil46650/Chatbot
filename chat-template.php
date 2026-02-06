<div class="chat-wrap" aria-live="polite" aria-hidden="true">

    <!-- Hidden checkbox for internal sidebar toggle -->
    <input type="checkbox" id="sidebarToggle">

    <!-- Header -->
    <div class="chat-header">
        <div class="flex-row">
            <div class="logo-col">
                <img src="<?php echo COACH_CHATBOT_URL; ?>assets/images/Spirit-Power.svg" alt="site logo" height="30">
            </div>
            <div class="toggle-col">
                <label for="sidebarToggle" aria-label="Toggle sidebar">
                    <img src="<?php echo COACH_CHATBOT_URL; ?>assets/images/toggle-btn.png" class="menu-icon" alt="open menu">
                    <img src="<?php echo COACH_CHATBOT_URL; ?>assets/images/cross.svg" class="close-icon" alt="close menu">
                </label>
            </div>
        </div>
    </div>
    

    <!-- Chat Body -->
    <div class="chat-body">
        <div class="chat-top">
            <img src="<?php echo COACH_CHATBOT_URL; ?>assets/images/coach-don1.png" alt="Coach Don">
            <h2>A Spirit Powered Life By <br> <span class="color-dark"> - DON BLACK </span></h2>
            <p class="text-grey">
                I'm here to help you discover how the <b>gifts and fruit of the Holy Spirit</b> can empower your daily life and guide you into God's plan and purpose.
            </p>
            <p class="text-grey">Together, we'll explore how the Holy Spirit takes what is natural in your life and empowers it to become <b>supernaturally effective</b>--in your faith, decisions, and everyday walk. 
            </p>
            <p class="text-grey">
                Ready to begin?
            </p>
            <p class="text-grey">Choose one of my coaching questions or ask me anything about life in the Spirit.
            </p>
            <p class="text-grey">Remember, it's not where you start--it's how you finish. <b>Be strong in the Lord.</b>
            </p>
            <span class="text-dark"><b> Coach Don </b></span>
            

            <div class="suggestion-wrap">
                <div class="suggestion-box"><img src="<?php echo COACH_CHATBOT_URL; ?>assets/images/peace.svg" alt="icon">
                    <p>How to find true peace and joy?</p>
                </div>
                <div class="suggestion-box"><img src="<?php echo COACH_CHATBOT_URL; ?>assets/images/pencil.svg" alt="icon">
                    <p>Can I really know God's will for me?</p>
                </div>
                <div class="suggestion-box"><img src="<?php echo COACH_CHATBOT_URL; ?>assets/images/brain-icon.svg" alt="icon">
                    <p>Who is Coach Don?</p>
                </div>
            </div>
        </div>

        <div class="chat-message" style="display: none;">
            <div class="flex-row">
                <div class="avatar-img1">
                    <img src="<?php echo COACH_CHATBOT_URL; ?>assets/images/user-pic.png" alt="User">
                </div>
                <div class="chat-box">
                    <p>I am Coach Don Black. Welcome to The Promise of the Holy Spirit. My goal is for you to
                        experience life the way God designed. In order to experience true peace and joy here
                        are 3 steps to take for a fresh start.</p>
                </div>
            </div>
            <div class="flex-row user-query">
                <div class="avatar-img1">
                    <img src="<?php echo COACH_CHATBOT_URL; ?>assets/images/DonBible.png" alt="Don Bible">
                </div>
                <div class="chat-box">
                    <p>How to find true peace and joy?</p>
                </div>
            </div>
        </div>
        <div class="fluent_form_custom" style="display:none;">
            <?php echo do_shortcode('[fluentform id="21"]'); ?>
        </div>
        <!-- Input Section -->
        <div class="chat-sec">
            <div class="input-box">
                <input id="coachChatInput" type="text" placeholder="Ask me anything about the Holy Spirit.." />
                <div class="btn-wrap">
                    <!-- <div class="icon-col">
                        <div class="icon-img">
                            <input type="file" id="fileUpload" accept="image/*">
                            <label for="fileUpload" class="upload-label">
                                <img src="<?php echo COACH_CHATBOT_URL; ?>assets/images/image.png" alt="Upload Image">
                            </label>
                        </div>
                        <div class="icon-attachment">
                            <input type="file" id="fileUpload2" accept="image/*">
                            <label for="fileUpload2" class="upload-label">
                                <img src="<?php echo COACH_CHATBOT_URL; ?>assets/images/attachment.png" alt="Upload Attachment">
                            </label>
                        </div>
                    </div> -->
                    <button class="send-btn" type="button" aria-label="Send"><i class="fa fa-paper-plane"></i></button>
                </div>
            </div>
            <div class="upgrade-banner">
                <a href="#">
                    <div class="flex-row">
                        <div>
                            <span>Sign up as a free study member to access all my tools and learn how the Holy Spirit empowers abundant life!</span>
                        </div>
                        <div class="user-profiles-wrap">
                            <!--<div class="user-profiles">
                                <img src="<?php echo COACH_CHATBOT_URL; ?>assets/images/user-icon.png" alt="">
                                <img class="user-icon1" src="<?php echo COACH_CHATBOT_URL; ?>assets/images/user-icon.png" alt="">
                                <img class="user-icon1" src="<?php echo COACH_CHATBOT_URL; ?>assets/images/user-icon.png" alt="">
                            </div> -->

                            <img src="<?php echo COACH_CHATBOT_URL; ?>assets/images/arrow.png" class="arrow-icon" alt="arrow icon">
                        </div>
                    </div>
                </a>
            </div>
        </div>
    </div>

    <!-- Sidebar (within chat-wrap) -->
    <div id="sidebar" class="sidebar">
        <div class="sidebar-top">
            <h3 class="new-chat-btn">
                <img src="<?php echo COACH_CHATBOT_URL; ?>assets/images/plus.svg" alt="icon"> New Chat
            </h3>
            
            <div class="today-chat">

            </div>

        </div>

        <div class="sidebar-bottom">
            <p class="setting1 logout-link">

                <?php if ( is_user_logged_in() ) : ?>

                    <!-- ✅ Show user avatar + logout link -->
                    <img class="user-avatar"
                        src="<?php echo esc_url( get_avatar_url( get_current_user_id(), ['size' => 64] ) ); ?>"
                        alt="User Avatar">

                    <a href="<?php echo esc_url( wp_logout_url( site_url( $_SERVER['REQUEST_URI'] ) ) ); ?>">
                        Logout
                    </a>

                <?php else : ?>

                    <!-- ✅ Show login link -->
                    <img class="user-avatar"
                        src="<?php echo esc_url( get_avatar_url( get_current_user_id(), ['size' => 64] ) ); ?>"
                        alt="User Avatar">

                    <a href="<?php echo esc_url( wp_login_url( site_url( $_SERVER['REQUEST_URI'] ) ) ); ?>">
                        Login
                    </a>

                <?php endif; ?>

            </p>
        </div>

    </div>
</div>

<!-- Floating FAB Button
<button id="chat-toggle"
    class="fixed bottom-4 right-4 bg-blue-500 text-white w-12 h-12 rounded-full shadow-lg flex justify-center items-center chat-floating-btn"
    aria-label="Open chat">
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
        stroke="currentColor" class="w-6 h-6" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round"
            d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l-4.155-4.155" />
    </svg>
<img src="https://finishingstrong.org/wp-content/uploads/2026/01/image-2.png">
</button> -->

<!-- Floating FAB Button -->
<button id="chat-toggle"
    class="chat-floating-btn"
    aria-label="Open chat">

    <!-- Chat Icon -->
    <!--  <svg class="chat-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round"
            d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l-4.155-4.155" />
    </svg>-->
<img src="https://finishingstrong.org/wp-content/uploads/2026/01/image-2.png">


    <!-- Close Icon -->
    <svg class="close-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
</button>
