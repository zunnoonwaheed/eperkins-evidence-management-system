from playwright.sync_api import sync_playwright
from pathlib import Path
import subprocess
import random
import time
import re
import os


SITE_URL = os.getenv("FRONTEND_URL", "http://localhost:3001")

AGE_OPTIONS = ["Under 40", "40 – 54", "55 – 64", "65 or older"]
HOME_OPTIONS = ["Own", "Rent", "Other / living with family"]
INCOME_OPTIONS = ["Under $30,000", "$30,000 – $59,999", "$60,000 – $99,999", "$100,000 or more"]
BACK_TAX_OPTIONS = ["Yes — more than $10,000", "Yes — less than $10,000", "I'm not sure", "No"]
BILL_OPTIONS = ["Credit cards & loans", "Insurance (health, auto, home)", "Utilities & phone", "None of these"]


# ------------------------------------------------------------
# Basic helpers
# ------------------------------------------------------------

def clean_text(value):
    if value is None:
        return ""
    value = str(value)
    if value.lower() == "nan":
        return ""
    return value.strip()


def normalize_choice(value):
    return (
        clean_text(value)
        .lower()
        .replace("+", " plus")
        .replace("/", " ")
        .replace("-", " ")
        .replace("–", " ")
        .replace("—", " ")
        .replace("_", " ")
        .replace(",", "")
        .replace("$", "")
        .replace("?", "")
        .replace("'", "")
        .replace(".", "")
    )


def normalize_option(value, options, aliases=None, default=""):
    raw = clean_text(value)
    if not raw:
        return default

    normalized = normalize_choice(raw)
    aliases = aliases or {}

    for option in options:
        if normalize_choice(option) == normalized:
            return option

    for key, option in aliases.items():
        if normalize_choice(key) == normalized:
            return option

    for option in options:
        opt_norm = normalize_choice(option)
        if normalized in opt_norm or opt_norm in normalized:
            return option

    return raw


def normalize_age(value):
    return normalize_option(
        value,
        AGE_OPTIONS,
        aliases={
            "under 40": "Under 40",
            "below 40": "Under 40",
            "40 54": "40 – 54",
            "55 64": "55 – 64",
            "65 plus": "65 or older",
            "65 older": "65 or older",
        },
        default="40 – 54",
    )


def normalize_home(value):
    return normalize_option(
        value,
        HOME_OPTIONS,
        aliases={
            "owner": "Own",
            "own": "Own",
            "rent": "Rent",
            "renter": "Rent",
            "other": "Other / living with family",
            "living with family": "Other / living with family",
            "family": "Other / living with family",
        },
        default="Rent",
    )


def normalize_income(value):
    return normalize_option(
        value,
        INCOME_OPTIONS,
        aliases={
            "under 30000": "Under $30,000",
            "under 30k": "Under $30,000",
            "30000 59999": "$30,000 – $59,999",
            "30k 60k": "$30,000 – $59,999",
            "60000 99999": "$60,000 – $99,999",
            "60k 100k": "$60,000 – $99,999",
            "100000 or more": "$100,000 or more",
            "100k or more": "$100,000 or more",
            "100000 plus": "$100,000 or more",
        },
        default="$60,000 – $99,999",
    )


def normalize_owe_back_taxes(value):
    return normalize_option(
        value,
        BACK_TAX_OPTIONS,
        aliases={
            "yes more than 10000": "Yes — more than $10,000",
            "yes over 10000": "Yes — more than $10,000",
            "over 10000": "Yes — more than $10,000",
            "more than 10000": "Yes — more than $10,000",
            "yes less than 10000": "Yes — less than $10,000",
            "under 10000": "Yes — less than $10,000",
            "less than 10000": "Yes — less than $10,000",
            "not sure": "I'm not sure",
            "unsure": "I'm not sure",
            "unknown": "I'm not sure",
            "no": "No",
        },
        default="I'm not sure",
    )


def normalize_monthly_bill(value):
    return normalize_option(
        value,
        BILL_OPTIONS,
        aliases={
            "credit cards": "Credit cards & loans",
            "credit cards and loans": "Credit cards & loans",
            "loans": "Credit cards & loans",
            "insurance": "Insurance (health, auto, home)",
            "health auto home": "Insurance (health, auto, home)",
            "utilities": "Utilities & phone",
            "utilities phone": "Utilities & phone",
            "phone": "Utilities & phone",
            "none": "None of these",
            "none of these": "None of these",
        },
        default="Insurance (health, auto, home)",
    )


def should_check_box(value, default_yes=True):
    value = clean_text(value)
    if not value:
        return default_yes
    return value.lower() not in ["no", "false", "0", "unchecked", "skip"]


def get_real_public_ip(page):
    try:
        return page.evaluate(
            """
            async () => {
                try {
                    const response = await fetch("https://api.ipify.org?format=json");
                    const data = await response.json();
                    return data.ip || "";
                } catch (error) {
                    return "";
                }
            }
            """
        )
    except Exception:
        return ""


def convert_webm_to_mp4(webm_path, mp4_path):
    try:
        cmd = [
            "ffmpeg", "-i", str(webm_path), "-c:v", "libx264", "-preset", "fast",
            "-crf", "23", "-pix_fmt", "yuv420p", str(mp4_path), "-y",
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError as error:
        print("[Error] FFmpeg conversion failed")
        print(error.stderr.decode("utf-8", errors="ignore"))
        return False


# ------------------------------------------------------------
# IP and timestamp helpers
# ------------------------------------------------------------

def build_ip_init_script(target_ip):
    safe_ip = clean_text(target_ip).replace("\\", "\\\\").replace('"', '\\"')

    return f"""
        (() => {{
            try {{
                const TARGET_IP = "{safe_ip}";
                window.__csvInjectedIp = TARGET_IP;

                const isZipField = (el) => {{
                    const attrs = [
                        el.name || "",
                        el.id || "",
                        el.placeholder || "",
                        el.getAttribute("autocomplete") || "",
                        el.getAttribute("aria-label") || "",
                    ].join(" ").toLowerCase();

                    return /\\bzip\\b|postal/.test(attrs);
                }};

                const isIpField = (el) => {{
                    const attrs = [
                        el.name || "",
                        el.id || "",
                        el.placeholder || "",
                        el.getAttribute("data-field") || "",
                        el.getAttribute("aria-label") || "",
                    ].join(" ").toLowerCase();

                    if (isZipField(el)) return false;

                    return (
                        /\\bip\\b/.test(attrs) ||
                        /ip_address/.test(attrs) ||
                        /ip-address/.test(attrs) ||
                        /submission_ip/.test(attrs) ||
                        /client_ip/.test(attrs) ||
                        /lead_ip/.test(attrs)
                    );
                }};

                const setField = (el) => {{
                    if (!el) return false;
                    if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA") return false;
                    if (el.type === "checkbox" || el.type === "radio") return false;
                    if (!isIpField(el)) return false;

                    el.value = TARGET_IP;
                    el.setAttribute("value", TARGET_IP);
                    el.dispatchEvent(new Event("input", {{ bubbles: true }}));
                    el.dispatchEvent(new Event("change", {{ bubbles: true }}));
                    el.dispatchEvent(new Event("blur", {{ bubbles: true }}));

                    return true;
                }};

                const apply = () => {{
                    document.querySelectorAll("input, textarea").forEach(setField);
                }};

                apply();
                document.addEventListener("DOMContentLoaded", apply);

                const observer = new MutationObserver(apply);
                observer.observe(document.documentElement, {{
                    childList: true,
                    subtree: true,
                    attributes: true
                }});

                setTimeout(() => observer.disconnect(), 20000);
            }} catch (error) {{}}
        }})();
    """


def set_ip_address_on_page(page, target_ip):
    target_ip = clean_text(target_ip)

    if not target_ip:
        return

    try:
        page.evaluate(
            """
            (targetIp) => {
                window.__csvInjectedIp = targetIp;

                const isZipField = (el) => {
                    const attrs = [
                        el.name || "",
                        el.id || "",
                        el.placeholder || "",
                        el.getAttribute("autocomplete") || "",
                        el.getAttribute("aria-label") || "",
                    ].join(" ").toLowerCase();

                    return /\\bzip\\b|postal/.test(attrs);
                };

                const isIpField = (el) => {
                    const attrs = [
                        el.name || "",
                        el.id || "",
                        el.placeholder || "",
                        el.getAttribute("data-field") || "",
                        el.getAttribute("aria-label") || "",
                    ].join(" ").toLowerCase();

                    if (isZipField(el)) return false;

                    return (
                        /\\bip\\b/.test(attrs) ||
                        /ip_address/.test(attrs) ||
                        /ip-address/.test(attrs) ||
                        /submission_ip/.test(attrs) ||
                        /client_ip/.test(attrs) ||
                        /lead_ip/.test(attrs)
                    );
                };

                document.querySelectorAll("input, textarea").forEach((el) => {
                    if (!el) return;
                    if (el.type === "checkbox" || el.type === "radio") return;
                    if (!isIpField(el)) return;

                    el.value = targetIp;
                    el.setAttribute("value", targetIp);

                    el.dispatchEvent(new Event("input", { bubbles: true }));
                    el.dispatchEvent(new Event("change", { bubbles: true }));
                    el.dispatchEvent(new Event("blur", { bubbles: true }));
                });
            }
            """,
            target_ip,
        )

    except Exception as error:
        print(f"[Debug] IP input injection failed: {error}")


def install_consent_footer_override_watcher(page, ip_address="", receipt_date=""):
    ip_address = clean_text(ip_address)
    receipt_date = clean_text(receipt_date)
    if not ip_address and not receipt_date:
        return

    try:
        page.evaluate(
            r"""
            ({ ipAddress, receiptDate }) => {
                window.__targetConsentIp = ipAddress || "";
                window.__targetConsentDate = receiptDate || "";
                let applying = false;

                const applyOverride = () => {
                    if (applying) return;
                    applying = true;
                    try {
                        const targetIp = window.__targetConsentIp || "";
                        const targetDate = window.__targetConsentDate || "";
                        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
                        let node;

                        while ((node = walker.nextNode())) {
                            const originalValue = node.nodeValue || "";
                            let newValue = originalValue;

                            if (targetIp && /IP\s*(?:address)?\s*:/i.test(newValue)) {
                                newValue = newValue.replace(
                                    /IP\s*(?:address)?\s*:\s*(?:—|-|\d{1,3}(?:\.\d{1,3}){3})?/i,
                                    `IP address: ${targetIp}`
                                );
                            }

                            if (targetDate && /Signed:\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/i.test(newValue)) {
                                const timeMatch = newValue.match(/T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/);
                                const suffixMatch = newValue.match(/\s*\(UTC\)/i);
                                const suffix = suffixMatch ? suffixMatch[0] : " (UTC)";
                                const timePart = timeMatch ? timeMatch[0] : "T12:00:00.000Z";
                                newValue = newValue.replace(
                                    /Signed:\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\s*(?:\(UTC\))?/i,
                                    `Signed: ${targetDate}${timePart}${suffix}`
                                );
                            }

                            if (newValue !== originalValue) node.nodeValue = newValue;
                        }
                    } finally {
                        applying = false;
                    }
                };

                applyOverride();

                if (window.__consentFooterOverrideObserver) {
                    window.__consentFooterOverrideObserver.disconnect();
                }

                let scheduled = false;
                window.__consentFooterOverrideObserver = new MutationObserver(() => {
                    if (scheduled) return;
                    scheduled = true;
                    requestAnimationFrame(() => {
                        scheduled = false;
                        applyOverride();
                    });
                });

                window.__consentFooterOverrideObserver.observe(document.documentElement, {
                    childList: true,
                    subtree: true,
                    characterData: true
                });

                setTimeout(() => {
                    if (window.__consentFooterOverrideObserver) {
                        window.__consentFooterOverrideObserver.disconnect();
                        window.__consentFooterOverrideObserver = null;
                    }
                    applyOverride();
                }, 7000);
            }
            """,
            {"ipAddress": ip_address, "receiptDate": receipt_date},
        )
        print("[Debug] Consent footer override watcher installed")
    except Exception as error:
        print(f"[Debug] Could not install consent footer override watcher: {error}")


def override_consent_footer(page, ip_address="", receipt_date=""):
    ip_address = clean_text(ip_address)
    receipt_date = clean_text(receipt_date)

    try:
        result = page.evaluate(
            r"""
            ({ ipAddress, receiptDate }) => {
                let ipChanged = false;
                let signedChanged = false;
                const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
                const textNodes = [];
                let node;
                while ((node = walker.nextNode())) textNodes.push(node);

                if (ipAddress) {
                    textNodes.forEach((textNode) => {
                        const value = textNode.nodeValue || "";
                        if (/IP\s*(?:address)?\s*:/i.test(value)) {
                            textNode.nodeValue = value.replace(
                                /IP\s*(?:address)?\s*:\s*(?:—|-|\d{1,3}(?:\.\d{1,3}){3})?/i,
                                `IP address: ${ipAddress}`
                            );
                            ipChanged = true;
                        }
                    });
                }

                if (receiptDate) {
                    textNodes.forEach((textNode) => {
                        const value = textNode.nodeValue || "";
                        if (/Signed:\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/i.test(value)) {
                            const timeMatch = value.match(/T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/);
                            const suffixMatch = value.match(/\s*\(UTC\)/i);
                            const suffix = suffixMatch ? suffixMatch[0] : " (UTC)";
                            const timePart = timeMatch ? timeMatch[0] : "T12:00:00.000Z";
                            textNode.nodeValue = value.replace(
                                /Signed:\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\s*(?:\(UTC\))?/i,
                                `Signed: ${receiptDate}${timePart}${suffix}`
                            );
                            signedChanged = true;
                        }
                    });
                }

                return { ipChanged, signedChanged, ipAddress, receiptDate };
            }
            """,
            {"ipAddress": ip_address, "receiptDate": receipt_date},
        )
        print(f"[Debug] Consent footer override result: {result}")
    except Exception as error:
        print(f"[Debug] Consent footer override failed: {error}")


# ------------------------------------------------------------
# Human profile and cursor/mouse helpers
# ------------------------------------------------------------

USER_PROFILES = [
    {"name": "mouse-heavy", "mistake_chance": 0.07, "random_clicks": True, "exploration_chance": 0.65, "idle_movement_chance": 0.35},
    {"name": "keyboard-efficient", "mistake_chance": 0.02, "random_clicks": False, "exploration_chance": 0.25, "idle_movement_chance": 0.18},
    {"name": "mixed", "mistake_chance": 0.04, "random_clicks": random.random() < 0.35, "exploration_chance": 0.45, "idle_movement_chance": 0.28},
]


def choose_user_profile():
    profile = random.choice(USER_PROFILES)
    print(f"[Profile] Simulating user: {profile['name']}")
    return profile


def inject_visible_cursor(page):
    page.evaluate(
        """
        (() => {
            if (document.getElementById("fake-recording-cursor")) return;
            const cursor = document.createElement("div");
            cursor.id = "fake-recording-cursor";
            cursor.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" style="filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.55));">
                    <path d="M3 2 L3 17 L7.5 12.5 L10.5 18 L13 16.8 L10 11.5 L16 11.5 Z" fill="white" stroke="black" stroke-width="1"/>
                </svg>
            `;
            Object.assign(cursor.style, {
                position: "fixed", top: "0px", left: "0px", zIndex: "999999999",
                pointerEvents: "none", transform: "translate(500px, 300px)", transformOrigin: "2px 2px",
            });
            document.body.appendChild(cursor);
            window.__mouseX = 500;
            window.__mouseY = 300;
            document.addEventListener("mousemove", (e) => {
                window.__mouseX = e.clientX;
                window.__mouseY = e.clientY;
                cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
            });
        })();
        """
    )


def get_mouse_position(page):
    try:
        return page.evaluate("""() => ({ x: window.__mouseX || 500, y: window.__mouseY || 300 })""")
    except Exception:
        return {"x": 500, "y": 300}


def update_mouse_position(page, x, y):
    try:
        page.evaluate("""({ x, y }) => { window.__mouseX = x; window.__mouseY = y; }""", {"x": float(x), "y": float(y)})
    except Exception:
        pass


def natural_mouse_idle(page, user_profile):
    if random.random() > user_profile["idle_movement_chance"]:
        return
    current = get_mouse_position(page)
    idle_x = max(60, min(1380, current.get("x", 500) + random.randint(-22, 22)))
    idle_y = max(60, min(1140, current.get("y", 300) + random.randint(-16, 16)))
    page.mouse.move(idle_x, idle_y, steps=random.randint(1, 3))
    update_mouse_position(page, idle_x, idle_y)
    time.sleep(random.uniform(0.04, 0.14))


def exploratory_form_behavior(page, target_element, user_profile):
    if random.random() > user_profile["exploration_chance"]:
        return
    try:
        current = get_mouse_position(page)
        for _ in range(random.randint(1, 3)):
            scan_x = max(120, min(1320, current.get("x", 500) + random.randint(-170, 170)))
            scan_y = max(100, min(1080, current.get("y", 300) + random.randint(-120, 120)))
            page.mouse.move(scan_x, scan_y, steps=random.randint(4, 9))
            update_mouse_position(page, scan_x, scan_y)
            time.sleep(random.uniform(0.08, 0.25))
    except Exception as error:
        print(f"[Debug] Exploratory behavior skipped: {error}")


def human_mouse_move_to_element(page, element, user_profile):
    try:
        element.scroll_into_view_if_needed(timeout=4000)
    except Exception:
        pass
    box = element.bounding_box()
    if not box:
        return
    exploratory_form_behavior(page, element, user_profile)
    current = get_mouse_position(page)
    target_x = box["x"] + random.randint(8, max(10, int(box["width"] - 8)))
    target_y = box["y"] + random.randint(8, max(10, int(box["height"] - 8)))
    mid_x = (current.get("x", 500) + target_x) / 2 + random.randint(-60, 60)
    mid_y = (current.get("y", 300) + target_y) / 2 + random.randint(-45, 45)
    page.mouse.move(mid_x, mid_y, steps=random.randint(8, 16))
    update_mouse_position(page, mid_x, mid_y)
    time.sleep(random.uniform(0.04, 0.14))
    page.mouse.move(target_x, target_y, steps=random.randint(6, 13))
    update_mouse_position(page, target_x, target_y)
    time.sleep(random.uniform(0.08, 0.28))


def mouse_click_locator_center(page, locator, user_profile, prefer_right_side=False):
    human_mouse_move_to_element(page, locator, user_profile)
    box = locator.bounding_box()
    if not box:
        return False
    click_x = box["x"] + box["width"] - random.randint(28, 48) if prefer_right_side else box["x"] + random.uniform(20, max(24, box["width"] - 20))
    click_y = box["y"] + random.uniform(16, max(20, box["height"] - 16))
    page.mouse.move(click_x, click_y, steps=random.randint(3, 7))
    update_mouse_position(page, click_x, click_y)
    time.sleep(random.uniform(0.10, 0.25))
    page.mouse.click(click_x, click_y)
    time.sleep(random.uniform(0.20, 0.50))
    return True


# ------------------------------------------------------------
# Locator and interaction helpers
# ------------------------------------------------------------

def first_existing_locator(page, locators):
    for locator in locators:
        try:
            if locator.count() > 0:
                return locator.first
        except Exception:
            continue
    return None


def first_visible_locator(page, locators):
    for locator in locators:
        try:
            count = locator.count()
            for i in range(count):
                item = locator.nth(i)
                if item.is_visible():
                    return item
        except Exception:
            continue
    return None


def wait_for_landing(page):
    print("[Debug] Waiting for survey landing page")
    candidates = [
        page.get_by_text(re.compile(r"Start My Free Survey", re.I)),
        page.get_by_role("button", name=re.compile(r"Start.*Survey", re.I)),
        page.get_by_text(re.compile(r"Question\s+1\s+of\s+6", re.I)),
        page.get_by_text(re.compile(r"What is your age range", re.I)),
    ]
    for locator in candidates:
        try:
            locator.first.wait_for(timeout=10000)
            return True
        except Exception:
            pass
    return False


def click_start_if_present(page, user_profile):
    start = first_visible_locator(
        page,
        [
            page.get_by_role("button", name=re.compile(r"Start.*Survey", re.I)),
            page.get_by_text(re.compile(r"Start My Free Survey", re.I)),
            page.locator("button").filter(has_text=re.compile(r"Start", re.I)),
            page.locator("a").filter(has_text=re.compile(r"Start", re.I)),
        ],
    )
    if start:
        print("[Debug] Clicking Start My Free Survey")
        mouse_click_locator_center(page, start, user_profile)
        time.sleep(random.uniform(0.8, 1.4))


def click_next(page, user_profile, label_regex=r"Next|See My Results"):
    next_button = first_visible_locator(
        page,
        [
            page.get_by_role("button", name=re.compile(label_regex, re.I)),
            page.locator("button").filter(has_text=re.compile(label_regex, re.I)),
            page.locator("a").filter(has_text=re.compile(label_regex, re.I)),
        ],
    )
    if not next_button:
        print(f"[Debug] Next/submit button not found for regex: {label_regex}")
        return False
    mouse_click_locator_center(page, next_button, user_profile)
    return True


def select_radio_by_text(page, label, user_profile):
    label = clean_text(label)
    if not label:
        return False
    escaped = re.escape(label)
    candidates = [
        page.get_by_text(re.compile(rf"^{escaped}$", re.I)),
        page.locator("label").filter(has_text=re.compile(rf"^{escaped}$", re.I)),
        page.locator("div,button,label").filter(has_text=re.compile(rf"^{escaped}$", re.I)),
        page.get_by_text(re.compile(escaped, re.I)),
    ]
    option = first_visible_locator(page, candidates)
    if not option:
        print(f"[Debug] Could not find survey option: {label}")
        return False
    print(f"[Debug] Selecting survey option: {label}")
    mouse_click_locator_center(page, option, user_profile)
    time.sleep(random.uniform(0.45, 0.9))
    return True


def answer_question(page, answer, user_profile):
    select_radio_by_text(page, answer, user_profile)
    time.sleep(random.uniform(0.35, 0.75))
    click_next(page, user_profile, label_regex=r"Next")
    time.sleep(random.uniform(0.75, 1.35))


def get_text_input(page, field_name):
    field_name = field_name.lower().strip()
    selector_map = {
        "first_name": [
            'input[name="first_name"]', 'input[name="firstName"]', 'input[name="first"]',
            'input[id*="first" i]', 'input[autocomplete="given-name"]', 'input[placeholder*="first" i]'
        ],
        "last_name": [
            'input[name="last_name"]', 'input[name="lastName"]', 'input[name="last"]',
            'input[id*="last" i]', 'input[autocomplete="family-name"]', 'input[placeholder*="last" i]'
        ],
        "email": [
            'input[name="email"]', 'input[name*="email" i]', 'input[id*="email" i]',
            'input[type="email"]', 'input[autocomplete="email"]', 'input[placeholder*="email" i]'
        ],
        "mobile_phone": [
            'input[name="phone"]', 'input[name*="phone" i]', 'input[name*="mobile" i]',
            'input[id*="phone" i]', 'input[type="tel"]', 'input[autocomplete="tel"]', 'input[placeholder*="555" i]'
        ],
        "zip_code": [
            'input[name="zip"]', 'input[name="zip_code"]', 'input[name*="zip" i]',
            'input[id*="zip" i]', 'input[autocomplete="postal-code"]', 'input[placeholder*="zip" i]'
        ],
    }
    return first_existing_locator(page, [page.locator(selector) for selector in selector_map.get(field_name, [])])


def human_type(page, element, text, user_profile, reduced_mistake_chance=False, allow_typos=True):
    text = clean_text(text)
    human_mouse_move_to_element(page, element, user_profile)
    element.click()
    time.sleep(random.uniform(0.18, 0.45))
    if not text:
        return

    mistake_chance = 0.0 if not allow_typos else (0.007 if reduced_mistake_chance else user_profile["mistake_chance"])
    print(f"[Debug] Typing '{text}' with mistake chance: {mistake_chance:.3f}")

    for i, char in enumerate(text):
        if allow_typos and random.random() < mistake_chance and i > 0:
            wrong_char = random.choice("abcdefghijklmnopqrstuvwxyz0123456789")
            element.type(wrong_char)
            time.sleep(random.uniform(0.04, 0.12))
            element.press("Backspace")
            time.sleep(random.uniform(0.04, 0.12))
            print(f"[Debug] Typo corrected: '{wrong_char}'")
        element.type(char)
        if char == " ":
            time.sleep(random.uniform(0.08, 0.22))
        elif char in ".,@-/()":
            time.sleep(random.uniform(0.07, 0.20))
        else:
            time.sleep(random.uniform(0.035, 0.12))
    time.sleep(random.uniform(0.25, 0.70))


def ensure_field_value(page, element, target_text, compare_digits=False):
    target_text = clean_text(target_text)
    if not target_text:
        return

    def digits_only(value):
        return "".join(ch for ch in clean_text(value) if ch.isdigit())

    try:
        current = element.input_value()
    except Exception:
        try:
            current = element.evaluate("el => el.value || el.textContent || ''")
        except Exception:
            return

    if compare_digits:
        if digits_only(current) == digits_only(target_text):
            return
    elif clean_text(current) == target_text:
        return

    print(f"[Debug] Field mismatch. Current='{current}', Target='{target_text}'. Fixing.")
    try:
        element.click()
        element.fill(target_text)
        time.sleep(random.uniform(0.12, 0.30))
        return
    except Exception:
        pass

    try:
        element.evaluate(
            """
            (el, targetText) => {
                if ("value" in el) el.value = targetText;
                el.dispatchEvent(new Event("input", { bubbles: true }));
                el.dispatchEvent(new Event("change", { bubbles: true }));
                el.dispatchEvent(new Event("blur", { bubbles: true }));
            }
            """,
            target_text,
        )
    except Exception:
        pass


def force_set_contact_fields(page, first_name, last_name, email, mobile_phone, zip_code):
    try:
        result = page.evaluate(
            """
            ({ firstName, lastName, email, phone, zip }) => {
                const setValue = (selectors, value) => {
                    for (const selector of selectors) {
                        const el = document.querySelector(selector);
                        if (!el) continue;
                        if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA") continue;
                        if (el.type === "checkbox" || el.type === "radio" || el.type === "hidden") continue;
                        el.focus();
                        el.value = value || "";
                        el.setAttribute("value", value || "");
                        el.dispatchEvent(new Event("input", { bubbles: true }));
                        el.dispatchEvent(new Event("change", { bubbles: true }));
                        el.dispatchEvent(new Event("blur", { bubbles: true }));
                        return true;
                    }
                    return false;
                };

                return {
                    firstSet: setValue(['input[name="first_name"]', 'input[name="firstName"]', 'input[name="first"]', 'input[id*="first" i]'], firstName),
                    lastSet: setValue(['input[name="last_name"]', 'input[name="lastName"]', 'input[name="last"]', 'input[id*="last" i]'], lastName),
                    emailSet: setValue(['input[name="email"]', 'input[name*="email" i]', 'input[id*="email" i]', 'input[type="email"]'], email),
                    phoneSet: setValue(['input[name="phone"]', 'input[name*="phone" i]', 'input[name*="mobile" i]', 'input[id*="phone" i]', 'input[type="tel"]'], phone),
                    zipSet: setValue(['input[name="zip"]', 'input[name="zip_code"]', 'input[name*="zip" i]', 'input[id*="zip" i]', 'input[autocomplete="postal-code"]'], zip)
                };
            }
            """,
            {
                "firstName": first_name,
                "lastName": last_name,
                "email": email,
                "phone": mobile_phone,
                "zip": zip_code,
            },
        )
        print(f"[Debug] Force-set contact fields result: {result}")
    except Exception as error:
        print(f"[Debug] Force-set contact fields failed: {error}")


def click_consent_checkbox(page, user_profile):
    print("[Debug] Looking for tax relief consent checkbox")
    try:
        checkbox = first_existing_locator(
            page,
            [
                page.locator('input[name="tcpa_consent"]'),
                page.locator('input[id*="tcpa" i]'),
                page.locator('input[name*="consent" i]'),
                page.locator('input[id*="consent" i]'),
                page.locator('input[type="checkbox"]').first,
            ],
        )
        if not checkbox:
            print("[Debug] Consent checkbox not found")
            return False

        human_mouse_move_to_element(page, checkbox, user_profile)
        time.sleep(random.uniform(0.20, 0.50))
        try:
            checkbox.check(force=True)
        except Exception:
            checkbox.evaluate(
                """
                (el) => {
                    el.checked = true;
                    el.dispatchEvent(new Event("input", { bubbles: true }));
                    el.dispatchEvent(new Event("change", { bubbles: true }));
                    el.dispatchEvent(new Event("click", { bubbles: true }));
                }
                """
            )

        time.sleep(random.uniform(0.30, 0.70))
        is_checked = page.evaluate(
            """
            () => {
                const cb = document.querySelector('input[name="tcpa_consent"], input[id*="tcpa" i], input[name*="consent" i], input[id*="consent" i], input[type="checkbox"]');
                return cb ? cb.checked : false;
            }
            """
        )
        print(f"[Debug] Final consent checkbox verification: {is_checked}")
        return bool(is_checked)
    except Exception as error:
        print(f"[Debug] Consent checkbox failed: {error}")
        return False


def validate_form_before_submit(page):
    try:
        validation_errors = page.evaluate(
            """
            () => Array.from(document.querySelectorAll(':invalid')).map(field => ({
                name: field.name || field.id || field.tagName,
                value: field.value || ''
            }))
            """
        )
        if validation_errors:
            print(f"[Debug] Validation errors found: {len(validation_errors)}")
            for error in validation_errors:
                print(f"[Debug] Invalid field: {error}")
        else:
            print("[Debug] Form validation passed before submit")
        return validation_errors
    except Exception as error:
        print(f"[Debug] Validation check failed: {error}")
        return []


def submit_form_with_retries(page, user_profile, ip_address="", receipt_date=""):
    print("[Debug] Starting final submit behavior")
    max_attempts = 2
    submission_successful = False

    for attempt in range(max_attempts):
        print(f"[Debug] Submit attempt {attempt + 1}/{max_attempts}")
        try:
            set_ip_address_on_page(page, ip_address)
            override_consent_footer(page, ip_address=ip_address, receipt_date=receipt_date)
            time.sleep(random.uniform(0.45, 0.90))

            clicked = click_next(page, user_profile, label_regex=r"See My Results|Submit|Finish|Results")
            if not clicked:
                return False

            print(f"[Debug] Final submit clicked on attempt {attempt + 1}")
            time.sleep(random.uniform(1.4, 2.2))

            success_indicator = page.evaluate(
                """
                () => {
                    const text = document.body.innerText || "";
                    if (/thank you/i.test(text)) return { type: "thank_you" };
                    if (/received/i.test(text)) return { type: "received" };
                    if (/results/i.test(text) && /submitted|matched|specialist|thank/i.test(text)) return { type: "results_text" };
                    if (/success/i.test(text) && !/error/i.test(text)) return { type: "success_text" };
                    return null;
                }
                """
            )
            if success_indicator:
                print(f"[Debug] Submission detected: {success_indicator}")
                submission_successful = True
                time.sleep(random.uniform(2.0, 3.2))
                break

            if attempt < max_attempts - 1:
                print("[Debug] No confirmation detected, retrying submit")
                time.sleep(random.uniform(1.0, 1.8))
        except Exception as submit_error:
            print(f"[Debug] Submit attempt failed: {submit_error}")
            if attempt < max_attempts - 1:
                time.sleep(random.uniform(1.0, 1.8))

    print(f"[Debug] Final URL after submission: {page.url}")
    print(f"[Debug] Submission successful: {submission_successful}")
    return submission_successful


# ------------------------------------------------------------
# Main automation
# ------------------------------------------------------------

def fill_form_and_record(data, video_path):
    video_path = Path(video_path)
    video_path.parent.mkdir(exist_ok=True)

    user_profile = choose_user_profile()

    first_name = clean_text(data.get("First Name", ""))
    last_name = clean_text(data.get("Last Name", ""))
    mobile_phone = clean_text(data.get("Mobile Phone", ""))
    email = clean_text(data.get("Email", ""))
    zip_code = clean_text(data.get("ZIP Code", ""))

    age_range = normalize_age(data.get("Age Range", ""))
    home_status = normalize_home(data.get("Home Status", ""))
    household_income = normalize_income(data.get("Household Income", ""))
    owe_back_taxes = normalize_owe_back_taxes(data.get("Owe Back Taxes", data.get("Tax Debt Amount", "")))
    monthly_bill_reduction = normalize_monthly_bill(data.get("Monthly Bill Reduction", data.get("Monthly Bills", "")))

    contact_consent = clean_text(data.get("Contact Consent", "yes"))
    receipt_date = clean_text(data.get("Receipt Date", ""))
    ip_address = clean_text(data.get("IP Address", ""))

    print(f"[Debug] Receipt Date from row: '{receipt_date}'")
    print(f"[Debug] IP Address from row: '{ip_address}'")
    print(f"[Debug] Survey answers: age='{age_range}', home='{home_status}', income='{household_income}', taxes='{owe_back_taxes}', bills='{monthly_bill_reduction}'")

    with sync_playwright() as p:
        headless = os.getenv("HEADLESS", "true").lower() not in ["false", "0", "no"]
        browser = p.chromium.launch(headless=headless, args=["--disable-dev-shm-usage", "--no-sandbox"])

        context = browser.new_context(
            viewport={"width": 1440, "height": 1200},
            record_video_dir=str(video_path.parent),
            record_video_size={"width": 1440, "height": 1200},
        )

        def route_ip_api(route, request):
            try:
                url = request.url.lower()
                accept_header = request.headers.get("accept", "").lower()
                is_ip_lookup = re.search(r"ipify|ip-api|ipinfo|api.*ip|/ip\b|checkip|icanhazip", url, re.I)
                if ip_address and is_ip_lookup:
                    wants_json = "format=json" in url or "json" in accept_header or "ip-api" in url or "ipinfo" in url
                    if wants_json:
                        return route.fulfill(
                            status=200,
                            body=f'{{"ip":"{ip_address}"}}',
                            headers={"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                        )
                    return route.fulfill(
                        status=200,
                        body=ip_address,
                        headers={"Content-Type": "text/plain", "Access-Control-Allow-Origin": "*"},
                    )
            except Exception:
                pass
            return route.continue_()

        if ip_address:
            try:
                context.route("**/*", route_ip_api)
            except Exception as route_error:
                print(f"[Debug] Could not install IP route override: {route_error}")
            try:
                context.add_init_script(build_ip_init_script(ip_address))
            except Exception as init_error:
                print(f"[Debug] Could not add IP init script: {init_error}")

        page = context.new_page()

        page.on("console", lambda msg: print(f"[Browser Console] {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"[Browser Page Error] {err}"))

        def log_request(request):
            try:
                url = request.url
                if any(word in url.lower() for word in ["submit", "form", "lead", "survey", "contact", "api"]):
                    print(f"[Network Request] {request.method} {url}")
                    try:
                        print(f"[Request Payload] {request.post_data}")
                    except Exception:
                        pass
            except Exception as error:
                print(f"[Request Log Error] {error}")

        def log_response(response):
            try:
                url = response.url
                if any(word in url.lower() for word in ["submit", "form", "lead", "survey", "contact", "api"]):
                    print(f"[Network Response] {response.status} {url}")
                    try:
                        body = response.text()
                        print(f"[Network Body] {body[:1000]}")
                    except Exception as body_error:
                        print(f"[Network Body Error] {body_error}")
            except Exception as error:
                print(f"[Network Log Error] {error}")

        page.on("request", log_request)
        page.on("response", log_response)

        print(f"[Debug] Navigating to live site: {SITE_URL}")
        page.goto(SITE_URL, wait_until="domcontentloaded", timeout=60000)

        if not ip_address:
            detected_ip = get_real_public_ip(page)
            if detected_ip:
                ip_address = detected_ip
                print(f"[Debug] Detected real public IP: {ip_address}")

        try:
            page.wait_for_load_state("networkidle", timeout=15000)
        except Exception:
            pass

        inject_visible_cursor(page)
        set_ip_address_on_page(page, ip_address)

        if not wait_for_landing(page):
            raise RuntimeError("Could not locate survey landing page on the live site.")

        click_start_if_present(page, user_profile)

        answer_question(page, age_range, user_profile)
        answer_question(page, home_status, user_profile)
        answer_question(page, household_income, user_profile)
        answer_question(page, owe_back_taxes, user_profile)

        # Consent block can appear after the tax question. Install watcher before checking it.
        install_consent_footer_override_watcher(page, ip_address=ip_address, receipt_date=receipt_date)
        set_ip_address_on_page(page, ip_address)
        override_consent_footer(page, ip_address=ip_address, receipt_date=receipt_date)

        if should_check_box(contact_consent, default_yes=True):
            click_consent_checkbox(page, user_profile)
            time.sleep(random.uniform(0.45, 0.90))
            override_consent_footer(page, ip_address=ip_address, receipt_date=receipt_date)

        # Some versions show the monthly bills question after consent, some show consent after it.
        if first_visible_locator(page, [page.get_by_text(re.compile(r"Which monthly bills", re.I))]):
            answer_question(page, monthly_bill_reduction, user_profile)
        else:
            # If still on Q4 and Next is visible, continue.
            click_next(page, user_profile, label_regex=r"Next")
            time.sleep(random.uniform(0.75, 1.25))
            if first_visible_locator(page, [page.get_by_text(re.compile(r"Which monthly bills", re.I))]):
                answer_question(page, monthly_bill_reduction, user_profile)

        # Wait for final contact form.
        try:
            page.get_by_text(re.compile(r"Where should we send", re.I)).wait_for(timeout=10000)
        except Exception:
            pass

        set_ip_address_on_page(page, ip_address)
        override_consent_footer(page, ip_address=ip_address, receipt_date=receipt_date)

        contact_fields = [
            ("first_name", first_name, True, False),
            ("last_name", last_name, True, False),
            ("email", email, False, False),
            ("mobile_phone", mobile_phone, False, True),
            ("zip_code", zip_code, True, False),
        ]

        for field_name, value, reduced_mistake, compare_digits in contact_fields:
            locator = get_text_input(page, field_name)
            if not locator:
                print(f"[Debug] Text field not found: {field_name}")
                continue
            human_type(page, locator, value, user_profile, reduced_mistake_chance=reduced_mistake, allow_typos=True)
            ensure_field_value(page, locator, value, compare_digits=compare_digits)
            set_ip_address_on_page(page, ip_address)
            natural_mouse_idle(page, user_profile)
            time.sleep(random.uniform(0.30, 0.70))

        force_set_contact_fields(
            page,
            first_name=first_name,
            last_name=last_name,
            email=email,
            mobile_phone=mobile_phone,
            zip_code=zip_code,
        )
        set_ip_address_on_page(page, ip_address)
        override_consent_footer(page, ip_address=ip_address, receipt_date=receipt_date)

        validate_form_before_submit(page)
        time.sleep(random.uniform(1.2, 2.0))

        submit_form_with_retries(page, user_profile, ip_address=ip_address, receipt_date=receipt_date)

        video = page.video
        context.close()
        browser.close()

        if video:
            webm_path = Path(video.path())
            if convert_webm_to_mp4(webm_path, video_path):
                try:
                    webm_path.unlink()
                except Exception:
                    pass
            else:
                webm_path.rename(video_path)
            print(f"[Debug] Video saved to: {video_path}")
