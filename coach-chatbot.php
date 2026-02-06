<?php
/**
 * Plugin Name: Coach Chatbot
 * Description: Floating chatbot UI for Coach Don (manual response version). Injects a popup + button on every page.
 * Version: 1.0.0
 * Author: Your Name
 * License: GPLv2 or later
 */

if (!defined('ABSPATH')) exit;

define('COACH_CHATBOT_URL', plugin_dir_url(__FILE__));
define('COACH_CHATBOT_PATH', plugin_dir_path(__FILE__));

register_activation_hook(__FILE__, function () {
    global $wpdb;
    $table = $wpdb->prefix . 'coach_chat_history';
    $charset = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS $table (
        id BIGINT(20) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT(20) UNSIGNED NOT NULL,
        chat_id VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        messages LONGTEXT NOT NULL,
        fallback_count INT(3) NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_modified DATETIME DEFAULT CURRENT_TIMESTAMP
    ) $charset;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
});


function coach_chatbot_enqueue_assets() {

    if ( function_exists('fluentform_enqueue_form_scripts') ) {
        fluentform_enqueue_form_scripts(21); // Replace with your actual Fluent Form ID
    }

    wp_enqueue_style('coach-chatbot-style', COACH_CHATBOT_URL . 'assets/css/chatbot.css', [], '1.1.3');
    wp_enqueue_script('coach-chatbot-script', COACH_CHATBOT_URL . 'assets/js/chatbot.js', ['jquery'], '1.2.2', true);
    wp_enqueue_style('font-awesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css', [], '6.5.0');



    $qa_data = include __DIR__ . '/qa-data.php';

    $current_user = wp_get_current_user();

    wp_localize_script('coach-chatbot-script', 'CoachChatbotData', [
        'ajax_url'   => admin_url('admin-ajax.php'),
        'assets_url' => COACH_CHATBOT_URL,
        'fluent_form_shortcode' => do_shortcode('[fluentform id="21"]'),
        'qa' => $qa_data,
        'display_name' => $current_user->display_name,
        'is_logged_in' => is_user_logged_in(),
        'user_id' => get_current_user_id(),
        'login_url'=> '/login',
    ]);

    
}
add_action('wp_enqueue_scripts', 'coach_chatbot_enqueue_assets');


/**
 * Inject the chat UI into the site footer so it appears on all pages.
 */
function coach_chatbot_inject_ui() {
    // Allow themes or other plugins to disable output via filter
    $enabled = apply_filters('coach_chatbot_enabled', true);
    if (!$enabled) return;

    // Include template
    $tpl = COACH_CHATBOT_PATH . 'chat-template.php';
    if (file_exists($tpl)) {
        include $tpl;
    }
    
}
add_action('wp_footer', 'coach_chatbot_inject_ui', 99);

// SAVE CHAT
add_action('wp_ajax_save_chat_history', function () {
    if (!is_user_logged_in()) wp_send_json_error('Login required');

    global $wpdb;
    $table = $wpdb->prefix . 'coach_chat_history';
    $user_id  = get_current_user_id();
    $chat_id  = sanitize_text_field($_POST['chat_id']);
    $title    = sanitize_text_field($_POST['title']);
    $messages = wp_unslash($_POST['messages']);
    $fallback_count = intval($_POST['fallback_count'] ?? 0);

    $existing = $wpdb->get_var($wpdb->prepare(
        "SELECT id FROM $table WHERE chat_id = %s AND user_id = %d",
        $chat_id,
        $user_id
    ));

    $now = current_time('mysql');

    if ($existing) {
        // Update existing chat
        $wpdb->update(
            $table,
            [
                'messages'       => $messages,
                'last_modified'  => $now,
                'fallback_count' => $fallback_count
            ],
            ['id' => $existing]
        );
    } else {
        // Insert new chat
        $wpdb->insert(
            $table,
            [
                'user_id'        => $user_id,
                'chat_id'        => $chat_id,
                'title'          => $title,
                'messages'       => $messages,
                'fallback_count' => $fallback_count,
                'created_at'     => $now,
                'last_modified'  => $now
            ]
        );
    }
    wp_send_json_success('Chat saved successfully');
});



// GET USER CHATS
add_action('wp_ajax_get_user_chats', function () {
    if (!is_user_logged_in()) wp_send_json_error('Login required');
    global $wpdb;
    $table = $wpdb->prefix . 'coach_chat_history';
    $user_id = get_current_user_id();

    $rows = $wpdb->get_results($wpdb->prepare(
        "SELECT chat_id, title, messages, last_modified FROM $table WHERE user_id=%d ORDER BY last_modified DESC",
        $user_id
    ));
    wp_send_json_success($rows);
});



// ✅ Rename chat
add_action("wp_ajax_coach_rename_chat", function () {
    global $wpdb;
    $table = $wpdb->prefix . "coach_chat_history";

    $wpdb->update(
        $table,
        ['title' => sanitize_text_field($_POST['title'])],
        ['chat_id' => sanitize_text_field($_POST['chat_id'])]
    );

    wp_send_json_success();
});

// ✅ Delete chat
add_action("wp_ajax_coach_delete_chat", function () {
    global $wpdb;
    $table = $wpdb->prefix . "coach_chat_history";

    $wpdb->delete(
        $table,
        ['chat_id' => sanitize_text_field($_POST['chat_id'])]
    );

    wp_send_json_success();
});


add_action('wp_ajax_coach_openai_answer', 'coach_openai_answer');
add_action('wp_ajax_nopriv_coach_openai_answer', 'coach_openai_answer');

function coach_openai_answer() {

    $question = sanitize_text_field($_POST['question'] ?? '');
    if (empty($question)) {
        wp_send_json_error(['error' => 'Empty question']);
    }

    $api_key = defined('OPENAI_API_KEY') ? OPENAI_API_KEY : '';
    if (empty($api_key)) {
        wp_send_json_error(['error' => 'Missing API key']);
    }

    $q = strtolower($question);
    $suggested = [];
    $section = "Spiritual Growth & Daily Walk With God";

   // MASTER 1
    if (strpos($q, "holy spirit") !== false && strpos($q, "work today") !== false) {
        wp_send_json_success([
            'answer' => "Thank you for asking such a powerful question. The Holy Spirit is God living within every believer -- guiding, empowering and transforming hearts for Kingdom purpose.\n\nHow are you currently seeking to understand and follow the Holy Spirit guidance in your life?",
            'suggestions' => [
                "What are 3 specific ways I can deepen my relationship with God?"
            ]
        ]);
        return;
    }

    // FOLLOW-UP 1.1
    if (strpos($q, "deepen my relationship") !== false) {
        wp_send_json_success([
            'answer' => "Here are 3 specific ways to deepen your relationship with God:\n\n1. Daily prayer and seeking God's will - Prayer is how you align your heart with God and invite the Holy Spirit to guide your decisions and desires.\n\n2. Study God's Word consistently - Scripture reveals God's character, truth, and purpose, helping you grow spiritually and recognize His voice.\n\n3. Walk daily in surrender to the Holy Spirit - Allow the Holy Spirit to lead your reactions, relationships, and choices, producing spiritual fruit in your life.",
            'suggestions' => [
                "Why is the Holy Spirit essential for spiritual growth?"
            ]
        ]);
        return;
    }

    // FOLLOW-UP 1.2 (final)
    if (strpos($q, "essential for spiritual growth") !== false) {
        if ( ! is_user_logged_in() ) {
            wp_send_json_success([
                'answer' => "The Holy Spirit is essential for spiritual growth because He lives inside the believer, guides us into truth, transforms our character, and empowers us to live God's will. Spiritual growth is not produced by human effort, but by the Holy Spirit's ongoing work in us-producing spiritual fruit, giving discernment, and helping us walk in harmony with God.",
                'suggestions' => [
                    "What do you think is the most important thing to do next?"
                ]
            ]);
        }else{
                wp_send_json_success([
                'answer' => "The Holy Spirit is essential for spiritual growth because He lives inside the believer, guides us into truth, transforms our character, and empowers us to live God's will. Spiritual growth is not produced by human effort, but by the Holy Spirit's ongoing work in us-producing spiritual fruit, giving discernment, and helping us walk in harmony with God.",
                'suggestions' => []
            ]);
        }
        return;
    }

    // MASTER 2
    if (strpos($q, "know god") !== false && strpos($q, "will") !== false) {
        wp_send_json_success([
            'answer' => "Yes, you can know God's will through prayer, scripture, surrender and obedience. God desires to lead your daily life.\n\nWhat steps can you take today to seek God's will more intentionally?",
            'suggestions' => [
                "What are 3 specific things I can do today to discover God's will?"
            ]
        ]);
        return;
    }

    // FOLLOW-UP 2.1
    if (strpos($q, "3 specific things") !== false) {
        wp_send_json_success([
            'answer' =>  "3 things you can do today to discover God's will:\n\n1. Pray and ask the Holy Spirit for guidance - The course teaches that God's will becomes clear when we intentionally seek Him and invite the Holy Spirit to lead our decisions.\n\n2. Spend time in God's Word - Scripture reveals God's character, priorities, and direction. As you renew your mind, discernment follows.\n\n3. Pay attention to what brings spiritual peace and purpose - The Holy Spirit often confirms God's will through inner peace, joy, and alignment with your spiritual gifts and calling.\n\nThat's how discovery begins-one obedient step at a time.",
            'suggestions' => [
                "Is it ever too late to get back on God's chosen path?"
            ]
        ]);
        return;
    }

    // FOLLOW-UP 2.2 (final)
    if (strpos($q, "too late") !== false && strpos($q, "chosen path") !== false) {
        if ( ! is_user_logged_in() ) {
            wp_send_json_success([
                'answer' => "No-it is never too late to get back on God's chosen path. God's plan includes redemption, restoration, and renewed purpose, no matter where you've been or how far you feel you've drifted. Through repentance and the Holy Spirit's work, God restores relationship and realigns your life with His will.",
                'suggestions' => [
                    "What do you think is the most important thing to do next?"
                ]
            ]);
        }else{
                wp_send_json_success([
                'answer' => "No-it is never too late to get back on God's chosen path. God's plan includes redemption, restoration, and renewed purpose, no matter where you've been or how far you feel you've drifted. Through repentance and the Holy Spirit's work, God restores relationship and realigns your life with His will.",
                'suggestions' => []
            ]);
        }
        return;
    }


    // MASTER 3
    if (strpos($q, "coach don") !== false && strpos($q, "qualification") !== false) {
        wp_send_json_success([
            'answer' => "Coach Don is a Christian leader called to empower believers to walk boldly in the Holy Spirit and finish strong.\n\nWhat part of spiritual growth do you feel called to develop now?",
            'suggestions' => [
                "How can you help me grow in the Holy Spirit?"
            ]
        ]);
        return;
    }

    // FOLLOW-UP 3.1
    if (strpos($q, "can you help") !== false) {
        wp_send_json_success([
            'answer' => "I help you understand how the Holy Spirit is already working in you, recognize your God-given gifts and calling, and learn how to walk daily in God's will instead of relying on your own strength.\n\nThrough biblical teaching, reflection, and Spirit-led guidance, I help you move from confusion to clarity and from knowledge to transformation.",
            'suggestions' => [
                "How does the study work?"
            ]
        ]);
        return;
    }

    // FOLLOW-UP 3.2 (final)
    if (strpos($q, "study work") !== false) {
        if ( ! is_user_logged_in() ) {
            wp_send_json_success([
                'answer' => "The study works by helping you understand the Holy Spirit as God's gift, then guiding you through biblical teaching, personal reflection, and practical application so you can recognize how God has already been working in your life.\n\nIt focuses on your recent spiritual walk, helping you discern patterns, grow in awareness, and move forward in obedience and purpose rather than just gaining information .",
                'suggestions' => [
                    "What do you think is the most important thing to do next?"
                ]
            ]);
        }else{
            wp_send_json_success([
                'answer' => "The study works by helping you understand the Holy Spirit as God's gift, then guiding you through biblical teaching, personal reflection, and practical application so you can recognize how God has already been working in your life.\n\nIt focuses on your recent spiritual walk, helping you discern patterns, grow in awareness, and move forward in obedience and purpose rather than just gaining information .",
                'suggestions' => []
            ]);

        }

        return;
    }

    // ========= AI MODE (dynamic suggestions) ==========
    $docs = [
        'https://finishingstrong.org/wp-content/uploads/2025/11/Don-Black-professional-bio.docx',
        'https://finishingstrong.org/wp-content/uploads/2025/11/AI-Gods-Gift-or-Satans-Trap_.docx',
        'https://finishingstrong.org/wp-content/uploads/2025/11/The-Gifts-and-Calling-of-God-Assessment-User-Instructions.docx',
        'https://finishingstrong.org/wp-content/uploads/2025/11/How-You-Can-Be-Sure-You-Will-Go-to-Heaven.docx',
        'https://finishingstrong.org/wp-content/uploads/2025/11/Understanding-the-Fruit-of-the-Holy-Spirit-in-Daily-Life.docx',
        'https://finishingstrong.org/wp-content/uploads/2025/11/Gift-of-the-Holy-Spirit-Ebook.pdf'
    ];

    $docs_list = implode("\n", array_map(fn($d) => "- $d", $docs));

    $system_prompt = <<<PROMPT
You are Coach Don � short, strong, convicting spiritual guidance.
RULES:
- Short answers (4�6 sentences max)
- Ask ONE reflection question
- End with: "For more information, see section $section of the course materials."
- After answer ALWAYS output:

**Suggested Questions**
1. [related question]
2. [related question]
3. [related question]
PROMPT;

    $user_prompt = "Course documents:\n$docs_list\n\nStudent question: \"$question\"";

    $response = wp_remote_post("https://api.openai.com/v1/chat/completions", [
        'headers' => [
            'Authorization' => "Bearer $api_key",
            'Content-Type'  => 'application/json',
        ],
        'body' => wp_json_encode([
            'model' => 'gpt-4o-mini',
            'temperature' => 0.3,
            'max_tokens' => 350,
            'messages' => [
                ['role' => 'system', 'content' => $system_prompt],
                ['role' => 'user', 'content' => $user_prompt],
            ]
        ]),
    ]);

    $json = json_decode(wp_remote_retrieve_body($response), true);
    $answer = trim($json['choices'][0]['message']['content'] ?? "No response received.");

    // ===== extract dynamic Suggestions ======
    preg_match('/\*\*Suggested Questions\*\*(.*)/is', $answer, $matches);
    $dynamic_suggestions = [];

    if (!empty($matches[1])) {
        preg_match_all('/\d+\.\s*(.+)/', $matches[1], $found);
        $dynamic_suggestions = array_map('trim', $found[1] ?? []);
    }

    $answer = preg_replace('/\*\*Suggested Questions\*\*(.*)/is', '', $answer);

    wp_send_json_success([
        'answer'      => trim($answer),
        'suggestions' => $dynamic_suggestions
    ]);
}



/**
 * This hook fires right BEFORE data is saved into FluentForms DB
 */
// add_action('fluentform_before_insert_submission', function ($insertData, $data, $form) {

//     if ($form->id != 21) return; // <--- Your Form ID

//     // All submitted fields
//     $firstName = $data['names']['first_name'] ?? '';
//     $lastName  = $data['names']['last_name'] ?? '';
//     $email     = $data['email'] ?? '';
//     $phone     = $data['phone'] ?? '';
//     $subject   = $data['subject'] ?? '';
//     $message   = $data['message'] ?? '';

//     // Do whatever you want here
//     error_log("💥 Fluent Form Submission Received:\n" . print_r($data, true));

// }, 10, 3);
// add_action('fluentform_before_insert_submission', function($insertData, $data, $form) {
//     if ($form->id == 21) {
//         error_log('🔥 FluentForm triggered from chatbot!');
//         error_log(print_r($data, true));
//     }
// }, 10, 3);


// /**
//  * This hook fires AFTER data is stored
//  */
// add_action('fluentform_submission_inserted', function ($entryId, $formData, $form) {

//     if ($form->id != 21) return;

//     // EntryID reference (useful for CRM / Zapier)
//     error_log("✅ Fluent Form saved. Entry ID: " . $entryId);

// }, 10, 3);



add_action('plugins_loaded', function() {
    // Register AJAX hooks after all plugins are ready
    add_action('wp_ajax_coachbot_submit_fluentform', 'coachbot_submit_fluentform');
    add_action('wp_ajax_nopriv_coachbot_submit_fluentform', 'coachbot_submit_fluentform');
});


function coachbot_submit_fluentform() {
    $form_id = intval($_POST['form_id']);
    if (!$form_id) {
        wp_send_json_error('Missing form ID');
    }

    // ✅ Make sure FluentForm classes are loaded now
    if ( ! class_exists('\FluentForm\App\Modules\Entries\EntryHandler') ) {
        wp_send_json_error('FluentForm not installed or not loaded yet');
    }

    $data = [];
    foreach ($_POST as $key => $value) {
        if (in_array($key, ['action', 'form_id'])) continue;
        $data[$key] = sanitize_text_field($value);
    }

    try {
        $entryHandler = new \FluentForm\App\Modules\Entries\EntryHandler();
        $entry = $entryHandler->handleSubmission($form_id, $data, true);

        // Fire FluentForm hooks (optional)
        do_action('fluentform_submission_inserted', $entry->id, $form_id);

        wp_send_json_success(['message' => 'Form submitted successfully!', 'entry_id' => $entry->id]);
    } catch (Exception $e) {
        wp_send_json_error($e->getMessage());
    }
}
