document.addEventListener("DOMContentLoaded", function () {
    const chatToggle = document.getElementById("chat-toggle");
    const chatWrap = document.querySelector(".chat-wrap");
    const chatBody = document.querySelector(".chat-top");
    const inputField = document.querySelector(".input-box input");
    const sendBtn = document.querySelector(".send-btn");
    const newChatBtn = document.querySelector(".new-chat-btn");
    const sidebarToggle = document.getElementById("sidebarToggle");
    const todayChat = document.querySelector(".today-chat");
    const qaData = (typeof CoachChatbotData !== "undefined") ? CoachChatbotData.qa : {};
    let currentTypingCallback = null;


    let typingInterval = null;
    let stopRequested = false;

    // ✅ Placeholder show only at start (first time only)
    let placeholderRemoved = false;
    const originalPlaceholder = inputField.getAttribute("placeholder") || "";

    function removePlaceholderOnce() {
        if (placeholderRemoved) return;
        placeholderRemoved = true;
        inputField.setAttribute("placeholder", "");
    }

    function resetSendButton() {
        sendBtn.innerHTML = '<i class="fa fa-paper-plane"></i>';
        sendBtn.classList.remove("stop-mode");
    }

    let currentChat = {
        id: null,
        title: "",
        messages: [],
        fallback_count: 0,
        guest_message_count: 0,
        user_message_count: 0,  // for logged-in users
        video_shown: false
    };

    if (chatToggle) {
        chatToggle.classList.add("animate");

        setTimeout(() => {
            chatToggle.classList.remove("animate");
        }, 20000); // 20 sec
    }


    // ✅ CLOSE SIDEBAR ONLY WHEN CLICKING ON CHAT BODY
    document.querySelector(".chat-body").addEventListener("click", function (e) {
        const sidebarToggle = document.getElementById("sidebarToggle");
        const sidebar = document.getElementById("sidebar");
        const toggleBtn = document.querySelector(".toggle-col label");

        // Sidebar is NOT open �' do nothing
        if (!sidebarToggle.checked) return;

        // If click is inside sidebar �' don't close
        if (sidebar.contains(e.target)) return;

        // If click is on toggle button (hamburger/X) �' don't interfere
        if (toggleBtn.contains(e.target)) return;

        // ✅ Clicked inside chat body (highlighted area) �' close sidebar
        sidebarToggle.checked = false;
    });




    /* =======================
       FLOATING CHAT TOGGLE
       ======================= */
    if (chatToggle && chatWrap) {
        chatToggle.addEventListener("click", e => {
            e.stopPropagation();
            chatWrap.classList.toggle("active");
            chatWrap.setAttribute("aria-hidden", chatWrap.classList.contains("active") ? "false" : "true");
        });

        chatWrap.addEventListener("click", e => e.stopPropagation());

        document.addEventListener("click", e => {
            if (!chatWrap.contains(e.target) && !chatToggle.contains(e.target)) {
                chatWrap.classList.remove("active");
                chatWrap.setAttribute("aria-hidden", "true");
            }
        });
    }

    /* =======================
       HELPERS
       ======================= */
    function disableSend(disable = true) {
        sendBtn.disabled = disable;
        sendBtn.style.opacity = disable ? "0.5" : "1";
        sendBtn.style.cursor = disable ? "not-allowed" : "pointer";
    }

    function stopTyping() {
        stopRequested = true;
        clearInterval(typingInterval);

        // Revert Stop �' Send
        sendBtn.innerHTML = '<i class="fa fa-paper-plane"></i>';
        sendBtn.classList.remove("stop-mode");
        sendBtn.disabled = false;
        sendBtn.style.opacity = "";
        sendBtn.style.cursor = "";

        if (typingWorker) typingWorker.postMessage({ action: "stop" });
        // If stopped in the middle, still call callback to show suggestions
        if (typeof currentTypingCallback === "function") {
            currentTypingCallback();
        }
        currentTypingCallback = null;



        // restore send click behavior
        sendBtn.onclick = () => {
            const val = inputField.value.trim();
            if (val && !sendBtn.disabled) {
                handleQuestion(val);
                inputField.value = "";
            }
        };
    }
    sendBtn.addEventListener('click', function () {
        if (sendBtn.classList.contains('stop-mode')) {
            stopTyping();
            return;
        }
    });



    function generateChatId() {
        return 'chat_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    }

    /* =======================
       LOGIN REQUIRED RESPONSE
       ======================= */
    function showLoginRequestBubble() {
        if (document.querySelector(".login-required-msg")) return;

        const chatMainBox = document.createElement("div");
        chatMainBox.classList.add("chat-main-box");

        const botWrapper = document.createElement("div");
        botWrapper.classList.add("bot-reply-box");

        const imgWrapper = document.createElement("div");
        imgWrapper.classList.add("bot-image");
        const icon = document.createElement("img");
        icon.src = `${CoachChatbotData.assets_url}assets/images/bot-icon-new.png`;
        icon.alt = "Bot Icon";
        icon.classList.add("bot-icon");
        imgWrapper.appendChild(icon);

        const botBubble = document.createElement("div");
        botBubble.classList.add("chat-box", "bot-reply", "login-required-msg");
        // botBubble.innerHTML = `Please log in to continue chatting.`;
        botBubble.innerHTML = `
            <p>To grow and become more like Jesus, I need to... </p>
            <ol>
               <li>Prioritize daily prayer and scripture reading.</li>
               <li>Engage in worship and fellowship with other believers to cultivate community and accountability. </li>
               <li>Discover God's calling and His spiritual gifts and seek to use them in service to others. Remember, growth takes time and intentionality, so be patient with yourself.</li>
            </ol>
             <p>Watch this special message from Coach Don:</p>
            <div class="video-wrap">
                <div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/1140168105?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerpolicy="strict-origin-when-cross-origin" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="4 Landing Page Register Now Video"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>
            </div>
             <p><a href="${CoachChatbotData.login_url}" class="login-link">Join</a> my AI 21-day Holy Spiritstudy to allow us to start working together. You can save your progress, create a journal and so much more!</p>

             <p style="margin-top:10px;">
                <a href="https://finishingstrong.org/spirit-powered-living/" class="landing-link">
                    Visit the Full Experience ?
                </a>
            </p>
	   
            `;

        botWrapper.appendChild(imgWrapper);
        botWrapper.appendChild(botBubble);
        chatMainBox.appendChild(botWrapper);
        chatBody.appendChild(chatMainBox);

        const wrap = document.createElement("div");
        wrap.className = "suggestion-wrap login-required";

        // const loginBtn = document.createElement("div");
        // loginBtn.className = "login-btn";
        // loginBtn.innerHTML = `<button>Login</button>`;
        // loginBtn.addEventListener("click", () => {
        //     window.location.href = CoachChatbotData.login_url;
        // });

        // wrap.appendChild(loginBtn);
        chatBody.appendChild(wrap);

        chatBody.scrollTop = chatBody.scrollHeight;
        disableAllSuggestionButtons();
        disableSend(true);
    }

    /* =======================
       SAVE CHAT (DB)
       ======================= */
    function saveOrUpdateChat() {
        if (!currentChat.id || !CoachChatbotData.is_logged_in) return;

        jQuery.post(CoachChatbotData.ajax_url, {
            action: "save_chat_history",
            chat_id: currentChat.id,
            title: currentChat.title,
            messages: JSON.stringify(currentChat.messages),
            fallback_count: currentChat.fallback_count || 0
        }, function (res) {
            if (res.success) renderSidebarHistory();
        });
    }


    function showSidebarLoader(show = true) {
        const todayChat = document.querySelector(".today-chat");
        if (!todayChat) return;

        let loader = document.getElementById("sidebar-loader");

        // ✅ Create loader dynamically if not exists
        if (!loader) {
            loader = document.createElement("div");
            loader.id = "sidebar-loader";
            loader.className = "sidebar-loader";
            loader.innerHTML = `<div class="spinner"></div>`;
            todayChat.prepend(loader);     // insert at top of chat history
        }

        loader.style.display = show ? "flex" : "none";

        // Disable interaction with chat items while loading
        todayChat.style.pointerEvents = show ? "none" : "auto";
        todayChat.style.opacity = show ? "0.5" : "1";
    }



    /* =======================
       LOAD CHAT LIST (SIDEBAR)
       ======================= */
    function renderSidebarHistory() {
        if (!CoachChatbotData.is_logged_in) return;

        showSidebarLoader(true); // ✅ Show loader when rendering starts

        jQuery.post(CoachChatbotData.ajax_url, { action: "get_user_chats" })
            .done(function (res) {
                if (!res.success) return;

                todayChat.innerHTML = ""; // Clear container first

                const chats = res.data;
                const groups = {};

                chats.forEach(chat => {
                    const modifiedDate = new Date(chat.last_modified);
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);

                    let label = modifiedDate.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
                    if (modifiedDate.toDateString() === today.toDateString()) label = "Today";
                    else if (modifiedDate.toDateString() === yesterday.toDateString()) label = "Yesterday";

                    if (!groups[label]) groups[label] = [];
                    groups[label].push(chat);
                });

                todayChat.innerHTML = ""; // 🧹 Clear existing sidebar content again

                Object.keys(groups).forEach(label => {
                    const heading = document.createElement("h5");
                    heading.textContent = label;
                    heading.classList.add("history-heading");
                    todayChat.appendChild(heading);

                    groups[label].sort((a, b) => new Date(b.last_modified) - new Date(a.last_modified))
                        .forEach(chat => {
                            const item = document.createElement("div");
                            item.className = "chat-history-item";
                            item.dataset.chatId = chat.chat_id;

                            item.innerHTML = `
                                <div class="chat-title">${chat.title}</div>
                                <div class="chat-options">
                                    <span class="dots">⋮</span>
                                    <div class="dropdown-menu">
                                        <div class="rename-option">Rename</div>
                                        <div class="delete-option">Delete</div>
                                    </div>
                                </div>
                            `;

                            todayChat.appendChild(item);

                            const dots = item.querySelector(".dots");
                            const menu = item.querySelector(".dropdown-menu");
                            const renameBtn = item.querySelector(".rename-option");
                            const deleteBtn = item.querySelector(".delete-option");

                            dots.addEventListener("click", (e) => {
                                e.stopPropagation();
                                document.querySelectorAll(".dropdown-menu").forEach(m => m.style.display = "none");
                                menu.style.display = "block";
                            });

                            document.addEventListener("click", () => {
                                menu.style.display = "none";
                            });

                            item.querySelector(".chat-title").addEventListener("click", () => {
                                sidebarToggle.checked = false;
                                loadChat(chat);
                            });

                            renameBtn.addEventListener("click", () => handleRename(chat));
                            deleteBtn.addEventListener("click", () => handleDelete(chat));
                        });
                });
            })
            .always(() => {
                // ✅ Hide loader ONLY after sidebar has finished rendering
                requestAnimationFrame(() => {
                    showSidebarLoader(false);
                });
            });
    }

    function handleRename(chat) {
        const newTitle = prompt("Enter new chat title:", chat.title);
        if (!newTitle || newTitle.trim() === "") return;

        showSidebarLoader(true);

        jQuery.post(CoachChatbotData.ajax_url, {
            action: "coach_rename_chat",
            chat_id: chat.chat_id,
            title: newTitle.trim()
        })
            .done(() => renderSidebarHistory())
            .fail(() => alert("❌ Network error while renaming."));
    }

    function handleDelete(chat) {
        if (!confirm("Delete this chat?")) return;

        showSidebarLoader(true);

        jQuery.post(CoachChatbotData.ajax_url, {
            action: "coach_delete_chat",
            chat_id: chat.chat_id
        })
            .done(() => {
                renderSidebarHistory();
                renderIntroChat();
            })
            .fail(() => alert("❌ Network error while deleting."));
    }


    /* =======================
       LOAD CHAT CONTENT
       ======================= */
    function loadChat(chat) {
        renderIntroChat(false);

        chatBody.innerHTML = `
            <img src="${CoachChatbotData.assets_url}assets/images/coach-don1.png" alt="Coach Don">
            <h2>Welcome to A Spirit Powered Life Study <br><span class="color-dark"> - DON BLACK </span></h2>
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
        `;

        const messages = JSON.parse(chat.messages);
        const chatMain = document.createElement("div");
        chatMain.classList.add("chat-main");
        const chatMainBox = document.createElement("div");
        chatMainBox.classList.add("chat-main-box");

        let lastBotMessage = null;
        messages.forEach(msg => {
            if (msg.role === "user") {
                const userBubble = document.createElement("div");
                userBubble.classList.add("chat-box", "user-query");
                userBubble.innerHTML = `<p>${msg.text}</p>`;
                chatMainBox.appendChild(userBubble);
            } else {
                const botWrapper = document.createElement("div");
                botWrapper.classList.add("bot-reply-box");

                const botImage = document.createElement("div");
                botImage.classList.add("bot-image");
                const icon = document.createElement("img");
                icon.src = `${CoachChatbotData.assets_url}assets/images/bot-icon-new.png`;
                icon.alt = "Bot Icon";
                icon.classList.add("bot-icon");
                botImage.appendChild(icon);

                const botBubble = document.createElement("div");
                botBubble.classList.add("chat-box", "bot-reply");

                // ✅ Format message into grouped paragraphs 2-4 lines
                botBubble.innerHTML = formatParagraphs(msg.text);

                botWrapper.appendChild(botImage);
                botWrapper.appendChild(botBubble);
                chatMainBox.appendChild(botWrapper);
            }
        });


        chatMain.appendChild(chatMainBox);
        chatBody.appendChild(chatMain);

        if (lastBotMessage) {
            const matchedKey = Object.keys(qaData).find(
                key => qaData[key].answer === lastBotMessage
            );
            const related = matchedKey && qaData[matchedKey]?.related?.length
                ? qaData[matchedKey].related
                : ["Who is the Holy Spirit and how does He work today?", "Can I really know God's will and then have the power to do it?", "Coach Don are you a real person and what are your qualifications? "];
            showRelatedQuestions(related);
        }

        chatBody.scrollTop = chatBody.scrollHeight;
        currentChat = {
            id: chat.chat_id,
            title: chat.title,
            messages: messages,
            fallback_count: chat.fallback_count || 0

        };


    }

    function formatParagraphs(text) {
        // Split text into sentences
        const sentences = text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);

        const paragraphs = [];
        let i = 0;

        while (i < sentences.length) {
            const chunkSize = Math.floor(Math.random() * 3) + 2; // Random 2–4 sentences
            paragraphs.push(sentences.slice(i, i + chunkSize).join(" "));
            i += chunkSize;
        }

        return paragraphs.join("<br><br>"); // 1 line gap between paragraphs
    }


    function showVideoWithLandingLink() {
        if (document.querySelector(".video-promo-msg")) return;

        // document.getElementsByClassName('suggestion-wrap').style.display='none';

        const chatMainBox = document.createElement("div");
        chatMainBox.classList.add("chat-main-box");

        const botWrapper = document.createElement("div");
        botWrapper.classList.add("bot-reply-box");

        const imgWrapper = document.createElement("div");
        imgWrapper.classList.add("bot-image");
        const icon = document.createElement("img");
        icon.src = `${CoachChatbotData.assets_url}assets/images/bot-icon-new.png`;
        icon.classList.add("bot-icon");
        imgWrapper.appendChild(icon);

        const botBubble = document.createElement("div");
        botBubble.classList.add("chat-box", "bot-reply", "video-promo-msg");

        botBubble.innerHTML = `
            <p>Watch this special message from Coach Don:</p>
            <div class="video-wrap">
                <div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/1140168105?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerpolicy="strict-origin-when-cross-origin" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="4 Landing Page Register Now Video"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>
            </div>
            <p style="margin-top:10px;">
                <a href="https://finishingstrong.org/spirit-powered-living/" class="landing-link">
                    Visit the Full Experience ?
                </a>
            </p>
        `;

        botWrapper.appendChild(imgWrapper);
        botWrapper.appendChild(botBubble);
        chatMainBox.appendChild(botWrapper);
        chatBody.appendChild(chatMainBox);

        chatBody.scrollTop = chatBody.scrollHeight;
    }



    /* =======================
   FIXED TYPE EFFECT (NO TAB PAUSE + CORRECT PARAGRAPH SPACING)
   ======================= */
    let typingWorker = null;

    function typeText(element, htmlString, speed = 18, callback = null) {
        stopRequested = false;
        element.innerHTML = "";
        currentTypingCallback = callback;


        if (typingWorker) {
            typingWorker.terminate();
            typingWorker = null;
        }

        // Prepare message
        const temp = document.createElement("div");
        temp.innerHTML = htmlString;
        const finalHTML = temp.innerHTML;

        let typedText = "";

        // Start worker
        typingWorker = new Worker(CoachChatbotData.assets_url + "assets/js/typing-worker.js");
        typingWorker.postMessage({ action: "start", text: finalHTML, typingSpeed: speed });

        typingWorker.onmessage = function (e) {
            // If stopped �' stop immediately, keep partial text only
            if (stopRequested) {
                typingWorker.terminate();
                typingWorker = null;
                // console.log("🛑 Typing stopped mid-way, keeping partial text.");
                return;
            }

            // Normal finish
            if (e.data.done) {
                typingWorker.terminate();
                typingWorker = null;

                if (typeof currentTypingCallback === "function") {
                    currentTypingCallback();
                }
                currentTypingCallback = null;

                return;
            }


            // Continue typing
            typedText += e.data.char;
            element.innerHTML = typedText;
            chatBody.scrollTop = chatBody.scrollHeight;
        };
    }




    /** ✅ Convert Markdown to Clean HTML (paragraphs, bold, list, links) */

    function markdownToHTML(md) {
        if (!md) return "";

        // --- inline helpers (no block-level changes here) ---
        const inline = (t) =>
            t
                .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")    // **bold**
                .replace(/\*(.+?)\*/g, "<em>$1</em>")                // *italic*
                .replace(/`([^`]+)`/g, "<code>$1</code>")            // `code`
                .replace(/(https?:\/\/[^\s]+)/g,
                    '<a href="$1" target="_blank" rel="noopener">$1</a>');

        // Split into blocks by blank line(s)
        const blocks = md.trim().split(/\n\s*\n/);

        const html = blocks.map(block => {
            const lines = block.split(/\n/);

            // Numbered list?
            const isOL = lines.every(l => /^\s*\d+\.\s+/.test(l)) && lines.length > 1;
            if (isOL) {
                const items = lines
                    .map(l => l.replace(/^\s*\d+\.\s+/, "").trim())
                    .filter(Boolean)
                    .map(txt => `<li>${inline(txt)}</li>`)
                    .join("");
                return `<ol>${items}</ol>`;
            }

            // Bulleted list?
            const isUL = lines.every(l => /^\s*[-*]\s+/.test(l)) && lines.length > 1;
            if (isUL) {
                const items = lines
                    .map(l => l.replace(/^\s*[-*]\s+/, "").trim())
                    .filter(Boolean)
                    .map(txt => `<li>${inline(txt)}</li>`)
                    .join("");
                return `<ul>${items}</ul>`;
            }

            // Regular paragraph (collapse single newlines into spaces)
            return `<p>${inline(block.replace(/\s*\n\s*/g, " ").trim())}</p>`;
        }).join("");

        return html;
    }


    /* =======================
       BOT MESSAGE
       ======================= */
    function showBotMessage(message, related = [], disableInputAfter = false) {
        disableSend(true);

        // 🟢 check if typing bubble already exists
        let typingBubble = document.querySelector(".bot-reply.typing-active");

        // �'� if it’s typing message �' show it and return
        if (message === "Coach Don Answering…") {
            if (!typingBubble) {
                const chatMainBox = document.createElement("div");
                chatMainBox.classList.add("chat-main-box");

                const botWrapper = document.createElement("div");
                botWrapper.classList.add("bot-reply-box");

                const imgWrapper = document.createElement("div");
                imgWrapper.classList.add("bot-image");

                const icon = document.createElement("img");
                icon.src = `${CoachChatbotData.assets_url}assets/images/bot-icon-new.png`;
                icon.alt = "Bot Icon";
                icon.classList.add("bot-icon");
                imgWrapper.appendChild(icon);

                const bubble = document.createElement("div");
                bubble.classList.add("chat-box", "bot-reply", "typing-active");
                bubble.innerHTML = `
                    <span class="typing-text">Coach Don Answering</span>
                    <span class="typing-dots">
                        <span>.</span><span>.</span><span>.</span>
                    </span>
                `;
                botWrapper.appendChild(imgWrapper);
                botWrapper.appendChild(bubble);
                chatMainBox.appendChild(botWrapper);
                chatBody.appendChild(chatMainBox);
                chatBody.scrollTop = chatBody.scrollHeight;
            }
            return;
        }

        // 🟡 reuse existing typing bubble if found
        if (typingBubble) {
            typingBubble.classList.remove("typing-active");
            typingBubble.innerText = ""; // clear typing text
        } else {
            disableSend(true);
            // fallback: create a new one
            const chatMainBox = document.createElement("div");
            chatMainBox.classList.add("chat-main-box");

            const botWrapper = document.createElement("div");
            botWrapper.classList.add("bot-reply-box");

            const imgWrapper = document.createElement("div");
            imgWrapper.classList.add("bot-image");

            const icon = document.createElement("img");
            icon.src = `${CoachChatbotData.assets_url}assets/images/bot-icon.png`;
            icon.alt = "Bot Icon";
            icon.classList.add("bot-icon");
            imgWrapper.appendChild(icon);

            typingBubble = document.createElement("div");
            typingBubble.classList.add("chat-box", "bot-reply");
            botWrapper.appendChild(imgWrapper);
            botWrapper.appendChild(typingBubble);
            chatMainBox.appendChild(botWrapper);
            chatBody.appendChild(chatMainBox);
        }

        // 🔴 Switch Send �' Stop icon
        sendBtn.innerHTML = '<i class="fa fa-stop"></i>';
        sendBtn.classList.add("stop-mode");
        sendBtn.disabled = false;
        sendBtn.style.opacity = "1";
        sendBtn.style.cursor = "pointer";

        // ✅ declare handleStopClick FIRST, then attach/remove
        const handleStopClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (sendBtn.classList.contains("stop-mode")) stopTyping();
        };

        sendBtn.removeEventListener("click", handleStopClick);
        sendBtn.addEventListener("click", handleStopClick);

        // ✍️ Start typing animation
        const bubble = typingBubble;
        setTimeout(() => {
            bubble.innerText = "";

            // const parts = message
            //     .split(/\n{2,}|(?<=\.|\?|!)\s+/)
            //     .map(p => p.trim())
            //     .filter(Boolean);
            // const formatted = parts.join("\n\n");
            // const formatted = markdownToHTML(message.trim());
            const formatted = markdownToHTML(String(message || "").trim());

            typeText(bubble, formatted, 18, () => {
                resetSendButton();
                showRelatedQuestions(related);
                if (!disableInputAfter) disableSend(false);
                currentChat.messages.push({ role: "bot", text: message });
                saveOrUpdateChat();

                // Show video after 3rd logged-in response finishes typing
                if (
                    CoachChatbotData.is_logged_in &&
                    currentChat.user_message_count === 3 &&
                    !currentChat.video_shown
                ) {
                    currentChat.video_shown = true;
                    setTimeout(() => {
                        showVideoWithLandingLink();
                    }, 800); // small delay after typing ends
                }
            });
        }, 800);

    }




    /* =======================
       RELATED QUESTIONS
       ======================= */
    function showRelatedQuestions(related) {
        if (!related || !related.length) return;
        disableAllSuggestionButtons();

        const wrap = document.createElement("div");
        wrap.className = "suggestion-wrap";

        related.forEach(q => {
            const btn = document.createElement("div");
            btn.className = "suggestion-box";
            btn.innerHTML = `<p>${q}</p>`;
            btn.addEventListener("click", () => handleQuestion(q));
            wrap.appendChild(btn);
        });

        chatBody.appendChild(wrap);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function disableAllSuggestionButtons() {
        document.querySelectorAll(".suggestion-wrap .suggestion-box").forEach(btn => {
            if (!btn.classList.contains("login-btn")) {
                btn.style.pointerEvents = "none";
                btn.style.opacity = "0.5";
                btn.style.cursor = "not-allowed";
            }
        });
    }

    /* =======================
       FALLBACK FORM
       ======================= */
    function showFallbackForm() {
        disableSend(true);

        showBotMessage(
            "I'd love to support you personally. Register now so I can respond to your questions with personalized guidance, and help you build your prayer and study journal.\nPlease complete the short form below.",
            [],
            true
        );

        setTimeout(() => {
            const formWrap =
                document.createElement("div");
            formWrap.className = "fallback-form-wrap";
            formWrap.innerHTML = `
                <div class="chatbot-custom-form">
                    <div class="flex-row">
                        <div class="flex-col-50">
                            <label for="cf_first_name">First Name</label>
                            <input type="text" id="cf_first_name" placeholder="First Name" required />
                            <small class="error-msg" aria-live="polite"></small>
                        </div>
                        <div class="flex-col-50">
                            <label for="cf_last_name">Last Name</label>
                            <input type="text" id="cf_last_name" placeholder="Last Name" required />
                            <small class="error-msg" aria-live="polite"></small>
                        </div>
                    </div>


                        <div class="flex-col">
                            <label for="cf_email">Email</label>
                            <input type="email" id="cf_email" placeholder="Email" required />
                            <small class="error-msg" aria-live="polite"></small>
                        </div>
                        <div class="flex-col">
                            <label for="cf_phone">Phone Number</label>
                            <input type="tel" id="cf_phone" placeholder="Phone Number" maxlength="10" required />
                            <small class="error-msg" aria-live="polite"></small>
                        </div>



                        <div class="flex-col">
                            <label for="cf_subject">Subject</label>
                            <input type="text" id="cf_subject" placeholder="Subject" required />
                            <small class="error-msg" aria-live="polite"></small>
                        </div>
                        <div class="flex-col">
                            <label for="cf_message">Message</label>
                            <textarea id="cf_message" placeholder="Your Message" required></textarea>
                            <small class="error-msg" aria-live="polite"></small>
                        </div>


                    <button id="cf_submit_btn">Submit</button>
                </div>
                <div class="chat-success-msg" style="display:none; text-align:center; padding:12px;">
                    Thank you! Coach Don will reach out soon.
                </div>
            `;

            chatBody.appendChild(formWrap);
            chatBody.scrollTop = chatBody.scrollHeight;

            const submitBtn = formWrap.querySelector("#cf_submit_btn");
            const chatbotForm = formWrap.querySelector(".chatbot-custom-form");
            const successMsg = formWrap.querySelector(".chat-success-msg");

            // Find static hidden FluentForm (must be present in DOM as you described)
            const hiddenForm = document.querySelector(".fluent_form_custom form#fluentform_21");


            if (!hiddenForm) {
                console.error("❌ Hidden FluentForm not found in DOM!");
                alert("Something went wrong. Please refresh the page.");
                return;
            }

            // Inputs
            const inputs = {
                fname: document.getElementById("cf_first_name"),
                lname: document.getElementById("cf_last_name"),
                email: document.getElementById("cf_email"),
                phone: document.getElementById("cf_phone"),
                subject: document.getElementById("cf_subject"),
                message: document.getElementById("cf_message")
            };

            // PHONE: allow optional +, digits only, 10-15 digits
            const phoneRegex = /^\+?\d{10}$/;

            // helper: show inline error and add invalid class
            function showError(inputEl, msg) {
                const err = inputEl.parentElement.querySelector(".error-msg");
                if (err) err.textContent = msg;
                inputEl.classList.add("invalid");
                inputEl.classList.remove("valid");
            }

            // helper: clear error for a single input
            function clearError(inputEl) {
                const err = inputEl.parentElement.querySelector(".error-msg");
                if (err) err.textContent = "";
                inputEl.classList.remove("invalid");
                inputEl.classList.add("valid");
            }

            // Validate single field, return true if valid
            function validateField(inputEl) {
                const val = (inputEl.value || "").trim();

                // required check
                if (!val) {
                    showError(inputEl, "This field is required");
                    return false;
                }

                // email check using browser validity (reliable) for type="email"
                if (inputEl.id === "cf_email") {
                    if (!inputEl.checkValidity()) {
                        showError(inputEl, "Please enter a valid email address");
                        return false;
                    }
                }

                // phone custom regex
                if (inputEl.id === "cf_phone") {
                    if (!phoneRegex.test(val)) {
                        showError(inputEl, "Enter a valid phone number (10 digits)");
                        return false;
                    }
                }

                // otherwise pass
                clearError(inputEl);
                return true;
            }

            // Validate whole form
            function validateForm() {
                let ok = true;
                Object.values(inputs).forEach(inp => {
                    if (!validateField(inp)) ok = false;
                });
                return ok;
            }

            // Clear errors on input/change
            Object.values(inputs).forEach(inp => {
                inp.addEventListener("input", () => {
                    if (inp.classList.contains("invalid")) {
                        validateField(inp);
                    } else {
                        // small optimization: clear message while typing
                        const err = inp.parentElement.querySelector(".error-msg");
                        if (err) err.textContent = "";
                    }
                });
            });

            // Submit handler
            submitBtn.addEventListener("click", (e) => {
                e.preventDefault();

                // final validation
                if (!validateForm()) {
                    return;
                }

                // Sync data to hidden FluentForm inputs
                hiddenForm.querySelector("[name='names[first_name]']").value = inputs.fname.value.trim();
                hiddenForm.querySelector("[name='names[last_name]']").value = inputs.lname.value.trim();
                hiddenForm.querySelector("[name='email']").value = inputs.email.value.trim();
                hiddenForm.querySelector("[name='phone']").value = inputs.phone.value.trim();
                hiddenForm.querySelector("[name='subject']").value = inputs.subject.value.trim();
                hiddenForm.querySelector("[name='message']").value = inputs.message.value.trim();

                // Trigger FluentForm submit button (FluentForm handles AJAX)
                const ffSubmit = hiddenForm.querySelector(".ff-btn-submit");
                if (ffSubmit) {
                    ffSubmit.click();
                    submitBtn.disabled = true;
                    submitBtn.innerText = "Submitting...";

                    // ✅ Automatically show success message after 10 seconds
                    setTimeout(() => {
                        chatbotForm.style.display = "none";
                        successMsg.style.display = "block";
                        disableSend(true);
                        console.log("✅ Chatbot custom form hidden, success message shown.");
                    }, 5000); // 5 seconds

                } else {
                    console.error("❌ FluentForm submit button not found!");
                    alert("Submission failed – please refresh and try again.");
                }

                // Listen for FluentForm success (FluentForm fires this event)
                document.addEventListener("fluentform_submission_success", (e) => {
                    if (hiddenForm.contains(e.target)) {
                        // hide custom form and show success message
                        chatbotForm.style.display = "none";
                        successMsg.style.display = "block";
                        disableSend(true);
                    }
                });

                // Listen for failure event (if FluentForm fires it)
                document.addEventListener("fluentform_submission_failed", (e) => {
                    if (hiddenForm.contains(e.target)) {
                        alert("❌ Something went wrong while submitting the form.");
                        submitBtn.disabled = true;
                        submitBtn.innerText = "Submit";
                    }
                });
            });
            disableSend(true);
        }, 6000);

        setTimeout(() => {
            disableSend(true);
        }, 6100);
    }


    /** ===========================
     ✅ SHOW USER BUBBLE (supports text + image + file preview)
    =========================== */
    function showUserBubble(text, files = []) {
        const wrap = document.createElement("div");
        wrap.classList.add("chat-main-box");

        const bubble = document.createElement("div");
        bubble.classList.add("chat-box", "user-query");

        // ✅ render uploaded files preview
        // if (files.length > 0) {
        //     files.forEach(f => {
        //         if (f.type.startsWith("image/")) {
        //             const url = URL.createObjectURL(f);
        //             bubble.innerHTML += `<img src="${url}" class="preview-thumb user-thumb">`;
        //         } else {
        //             bubble.innerHTML += `<div class="file-chip">📄 ${f.name}</div>`;
        //         }
        //     });
        // }

        // ✅ render user text
        if (text) bubble.innerHTML += `<p>${escapeHtml(text)}</p>`;

        wrap.appendChild(bubble);
        chatBody.appendChild(wrap);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, m => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[m]));
    }


    function handleQuestion(question) {
        if (!question) return;

        // ✅ Always show USER bubble first
        showUserBubble(question);

        const lowered = question.toLowerCase().trim();
        const contactTriggers = ["contact", "connect", "talk", "speak", "appointment", "meet"];
        const requiresContactForm = contactTriggers.some(w => lowered.includes(w));


        if (!CoachChatbotData.is_logged_in) {
            currentChat.guest_message_count++;

            if (currentChat.guest_message_count > 3) {
                showLoginRequestBubble();
                disableSend(true);
                return;
            }
        } else {
            // Logged-in user logic
            currentChat.user_message_count++;
        }


        // Remove old suggestions
        chatBody.querySelectorAll(".suggestion-wrap").forEach(el => el.remove());

        // Save message to chat history
        if (!currentChat.id) {
            currentChat.id = generateChatId();
            currentChat.title = question;
            currentChat.messages = [{ role: "user", text: question }];
        } else {
            currentChat.messages.push({ role: "user", text: question });
        }
        saveOrUpdateChat();

        // ✅ Show contact form if query requires contact
        if (requiresContactForm) {
            showFallbackForm();
            return;
        }

        // �'� typing loader
        showBotMessage("Coach Don Answering…", [], true);

        // 🔥 Send to OpenAI backend
        jQuery.post(CoachChatbotData.ajax_url, {
            action: "coach_openai_answer",
            question: question
        }, function (res) {
            if (res.success && res.data && res.data.answer) {
                showBotMessage(res.data.answer, res.data.suggestions ?? [], true);
            } else {
                showBotMessage("Sorry, I couldn't reach Coach Don right now.");
            }
        }).fail(function () {
            showBotMessage("Something went wrong while contacting Coach Don.");
        });
        removePlaceholderOnce();

    }






    /* =======================
       INTRO CHAT
       ======================= */
    function renderIntroChat(includeStarter = true) {
        if(!CoachChatbotData.is_logged_in){
            chatBody.innerHTML = `
            <img src="${CoachChatbotData.assets_url}assets/images/coach-don1.png" alt="Coach Don">
            <h2>Welcome to A Spirit Powered Life Study <br><span class="color-dark"> - DON BLACK </span></h2>
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
        `;
        }else{
            chatBody.innerHTML = `
            <img src="${CoachChatbotData.assets_url}assets/images/coach-don1.png" alt="Coach Don">
            <h2>21 TRUTHS FOR A Spirit Powered Life<br><span class="color-dark"> - DON BLACK </span></h2>
            <p class="text-grey">
                He who has begun a good work in you will complete it until the day of Jesus Christ.
            </p>
            <p class="text-grey"><b>Welcome ${CoachChatbotData.display_name} Don - I am glad you are here!</b>
            </p>
            <p class="text-grey">
               As a member, you and I can have an ongoing dialogue focused on growing in the presence and power of the Holy Spirit.
            </p>
            <p class="text-grey">Keep pressing forward. Maintain your pace. My goal is for you to fully reach His mark of His high calling by living in the power of the Holy Spirit. Let’s Go!
            </p>
            <p class="text-grey">How can I start journaling what God shows me.</p>
            <p class="text-grey">Study is based on my book “A Spirit Powered Life” You can <a href="#">download it here</a> to dig deeper.</p>
            <span class="text-dark"><b> Coach Don </b></span>
        `;
        }
        
        if (includeStarter) {
            const starter = document.createElement("div");
            starter.className = "suggestion-wrap";
            ["Who is the Holy Spirit and how does He work today?", "Can I really know God's will and then have the power to do it?", "Coach Don are you a real person and what are your qualifications?"].forEach(q => {
                const btn = document.createElement("div");
                btn.className = "suggestion-box";
                btn.innerHTML = `<p>${q}</p>`;
                btn.addEventListener("click", () => handleQuestion(q));
                starter.appendChild(btn);
            });
            chatBody.appendChild(starter);
        }
    }

    /* =======================
       NEW CHAT
       ======================= */
    if (newChatBtn) {
        newChatBtn.addEventListener("click", () => {
            currentChat = {
                id: null,
                title: "",
                messages: [],
                fallback_count: 0,
                guest_message_count: 0,
                user_message_count: 0,
                video_shown: false
            };

            placeholderRemoved = false;
            inputField.setAttribute("placeholder", originalPlaceholder);

            renderIntroChat();
            sidebarToggle.checked = false;
            disableSend(false);
        });
    }

    /* =======================
       USER INPUT
       ======================= */
    sendBtn.addEventListener("click", () => {
        const val = inputField.value.trim();
        if (val && !sendBtn.disabled) {
            handleQuestion(val);
            inputField.value = "";
            disableSend(true);
        }
    });

    inputField.addEventListener("keypress", e => {
        if (e.key === "Enter" && !sendBtn.disabled) {
            e.preventDefault();
            sendBtn.click();
        }
    });

    /* =======================
       INIT
       ======================= */
    renderIntroChat();
    renderSidebarHistory();
});


