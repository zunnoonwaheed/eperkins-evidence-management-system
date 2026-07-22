from playwright.sync_api import sync_playwright
from pathlib import Path
import subprocess
import random
import time
import re
import os


SITE_URL = os.getenv("FRONTEND_URL", "http://localhost:3002")

TAX_DEBT_OPTIONS = [
    "Under $10,000",
    "$10,000 – $24,999",
    "$25,000 – $49,999",
    "$50,000 – $99,999",
    "$100,000+",
    "Not sure",
]


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
    )


def normalize_tax_debt_value(value):
    raw = clean_text(value)

    if not raw:
        return ""

    normalized = normalize_choice(raw)

    aliases = {
        "under 10000": "Under $10,000",
        "under 10k": "Under $10,000",
        "less than 10000": "Under $10,000",
        "less than 10k": "Under $10,000",
        "10000 24999": "$10,000 – $24,999",
        "10k 25k": "$10,000 – $24,999",
        "10 25": "$10,000 – $24,999",
        "25000 49999": "$25,000 – $49,999",
        "25k 50k": "$25,000 – $49,999",
        "25 50": "$25,000 – $49,999",
        "50000 99999": "$50,000 – $99,999",
        "50k 100k": "$50,000 – $99,999",
        "50 100": "$50,000 – $99,999",
        "100000 plus": "$100,000+",
        "100k plus": "$100,000+",
        "100000": "$100,000+",
        "100k": "$100,000+",
        "not sure": "Not sure",
        "unsure": "Not sure",
        "unknown": "Not sure",
    }

    for option in TAX_DEBT_OPTIONS:
        if normalize_choice(option) == normalized:
            return option

    return aliases.get(normalized, raw)


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
            "ffmpeg",
            "-i",
            str(webm_path),
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "23",
            "-pix_fmt",
            "yuv420p",
            str(mp4_path),
            "-y",
        ]

        subprocess.run(cmd, check=True, capture_output=True)
        return True

    except subprocess.CalledProcessError as error:
        print("[Error] FFmpeg conversion failed")
        print(error.stderr.decode("utf-8", errors="ignore"))
        return False


# ------------------------------------------------------------
# IP and timestamp visual override helpers
# ------------------------------------------------------------

def build_ip_init_script(target_ip):
    safe_ip = clean_text(target_ip).replace("\\", "\\\\").replace('"', '\\"')

    return f"""
        (() => {{
            try {{
                const TARGET_IP = "{safe_ip}";
                window.__csvInjectedIp = TARGET_IP;

                const setField = (el) => {{
                    if (!el) return false;

                    if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA") {{
                        return false;
                    }}

                    if (el.type === "checkbox") {{
                        return false;
                    }}

                    el.value = TARGET_IP;
                    el.setAttribute("value", TARGET_IP);
                    el.dispatchEvent(new Event("input", {{ bubbles: true }}));
                    el.dispatchEvent(new Event("change", {{ bubbles: true }}));
                    el.dispatchEvent(new Event("blur", {{ bubbles: true }}));

                    return true;
                }};

                const apply = () => {{
                    const selectors = [
                        'input[name*="ip" i]',
                        'input[id*="ip" i]',
                        'textarea[name*="ip" i]',
                        'textarea[id*="ip" i]',
                        'input[data-field*="ip" i]',
                        'input[placeholder*="ip" i]'
                    ];

                    selectors.forEach((selector) => {{
                        document.querySelectorAll(selector).forEach(setField);
                    }});
                }};

                apply();
                document.addEventListener("DOMContentLoaded", apply);

                const observer = new MutationObserver(apply);
                observer.observe(document.documentElement, {{
                    childList: true,
                    subtree: true,
                    attributes: true
                }});

                setTimeout(() => observer.disconnect(), 12000);
            }} catch (error) {{}}
        }})();
    """


def set_ip_address_on_page(page, target_ip):
    """
    Sets only hidden/input IP fields.
    Does not manually edit the visible IP footer, because that can duplicate/corrupt the displayed IP.
    """

    target_ip = clean_text(target_ip)

    if not target_ip:
        return

    try:
        page.evaluate(
            """
            (targetIp) => {
                window.__csvInjectedIp = targetIp;

                document.querySelectorAll(
                    'input[name*="ip" i], input[id*="ip" i], input[data-field*="ip" i]'
                ).forEach((el) => {
                    if (!el) return;

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
    """
    Installs a MutationObserver before checkbox click.
    Prevents timestamp flash without causing an infinite mutation loop.
    """

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

                            if (targetIp && /IP:\s*/i.test(newValue)) {
                                newValue = newValue.replace(
                                    /IP:\s*(?:—|-|\d{1,3}(?:\.\d{1,3}){3})?/i,
                                    `IP: ${targetIp}`
                                );
                            }

                            if (
                                targetDate &&
                                /Signed:\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/i.test(newValue)
                            ) {
                                const timeMatch = newValue.match(/T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/);
                                const suffixMatch = newValue.match(/\s*\(UTC\)/i);
                                const suffix = suffixMatch ? suffixMatch[0] : " (UTC)";
                                const timePart = timeMatch ? timeMatch[0] : "T12:00:00.000Z";

                                newValue = newValue.replace(
                                    /Signed:\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\s*(?:\(UTC\))?/i,
                                    `Signed: ${targetDate}${timePart}${suffix}`
                                );
                            }

                            // Critical: only write when changed.
                            // This prevents observer recursion/freezing.
                            if (newValue !== originalValue) {
                                node.nodeValue = newValue;
                            }
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

                // Keep watcher only during the checkbox/signature moment.
                setTimeout(() => {
                    if (window.__consentFooterOverrideObserver) {
                        window.__consentFooterOverrideObserver.disconnect();
                        window.__consentFooterOverrideObserver = null;
                    }

                    applyOverride();
                }, 5000);
            }
            """,
            {
                "ipAddress": ip_address,
                "receiptDate": receipt_date,
            },
        )

        print("[Debug] Consent footer override watcher installed")

    except Exception as error:
        print(f"[Debug] Could not install consent footer override watcher: {error}")


def override_consent_footer(page, ip_address="", receipt_date=""):
    """
    Demo/backend-aligned override for Cacophinney consent footer.

    - Updates visible IP value if IP Address exists in CSV.
    - Updates visible Signed timestamp date if Receipt Date exists.
    - Keeps the original time portion from the site when only a date is supplied.
    """

    ip_address = clean_text(ip_address)
    receipt_date = clean_text(receipt_date)

    try:
        result = page.evaluate(
            r"""
            ({ ipAddress, receiptDate }) => {
                const normalize = (text) => (text || "").replace(/\s+/g, " ").trim();

                let ipChanged = false;
                let signedChanged = false;

                const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
                const textNodes = [];
                let node;

                while ((node = walker.nextNode())) {
                    textNodes.push(node);
                }

                if (ipAddress) {
                    textNodes.forEach((textNode) => {
                        const value = textNode.nodeValue || "";

                        if (/IP:\s*/i.test(value)) {
                            textNode.nodeValue = value.replace(
                                /IP:\s*(?:—|-|\d{1,3}(?:\.\d{1,3}){3})?/i,
                                `IP: ${ipAddress}`
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
            {
                "ipAddress": ip_address,
                "receiptDate": receipt_date,
            },
        )

        print(f"[Debug] Consent footer override result: {result}")

    except Exception as error:
        print(f"[Debug] Consent footer override failed: {error}")

# ------------------------------------------------------------
# Human profile system
# ------------------------------------------------------------

USER_PROFILES = [
    {
        "name": "mouse-heavy",
        "mistake_chance": 0.07,
        "random_clicks": True,
        "exploration_chance": 0.65,
        "idle_movement_chance": 0.35,
    },
    {
        "name": "keyboard-efficient",
        "mistake_chance": 0.02,
        "random_clicks": False,
        "exploration_chance": 0.25,
        "idle_movement_chance": 0.18,
    },
    {
        "name": "mixed",
        "mistake_chance": 0.04,
        "random_clicks": random.random() < 0.35,
        "exploration_chance": 0.45,
        "idle_movement_chance": 0.28,
    },
]


def choose_user_profile():
    profile = random.choice(USER_PROFILES)
    print(f"[Profile] Simulating user: {profile['name']}")
    return profile


# ------------------------------------------------------------
# Cursor and mouse helpers
# ------------------------------------------------------------

def inject_visible_cursor(page):
    page.evaluate(
        """
        (() => {
            if (document.getElementById("fake-recording-cursor")) return;

            const cursor = document.createElement("div");
            cursor.id = "fake-recording-cursor";

            cursor.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20"
                     style="filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.55));">
                    <path d="M3 2 L3 17 L7.5 12.5 L10.5 18 L13 16.8 L10 11.5 L16 11.5 Z"
                          fill="white"
                          stroke="black"
                          stroke-width="1"/>
                </svg>
            `;

            Object.assign(cursor.style, {
                position: "fixed",
                top: "0px",
                left: "0px",
                zIndex: "999999999",
                pointerEvents: "none",
                transform: "translate(500px, 300px)",
                transformOrigin: "2px 2px",
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
        return page.evaluate(
            """
            () => ({
                x: window.__mouseX || 500,
                y: window.__mouseY || 300
            })
            """
        )
    except Exception:
        return {"x": 500, "y": 300}


def update_mouse_position(page, x, y):
    try:
        page.evaluate(
            """
            ({ x, y }) => {
                window.__mouseX = x;
                window.__mouseY = y;
            }
            """,
            {"x": float(x), "y": float(y)},
        )
    except Exception:
        pass


def natural_mouse_idle(page, user_profile):
    if random.random() > user_profile["idle_movement_chance"]:
        return

    current = get_mouse_position(page)
    current_x = current.get("x", 500)
    current_y = current.get("y", 300)

    idle_x = max(60, min(1380, current_x + random.randint(-22, 22)))
    idle_y = max(60, min(1140, current_y + random.randint(-16, 16)))

    page.mouse.move(idle_x, idle_y, steps=random.randint(1, 3))
    update_mouse_position(page, idle_x, idle_y)
    time.sleep(random.uniform(0.04, 0.14))


def random_click_somewhere(page, user_profile):
    if not user_profile["random_clicks"]:
        return

    if random.random() < 0.10:
        x = random.randint(220, 1150)
        y = random.randint(160, 900)
        print(f"[Fidget Click] Random click at ({x}, {y})")
        page.mouse.move(x, y, steps=random.randint(3, 8))
        update_mouse_position(page, x, y)
        time.sleep(random.uniform(0.05, 0.15))
        page.mouse.click(x, y)
        time.sleep(random.uniform(0.10, 0.30))


def exploratory_form_behavior(page, target_element, user_profile):
    if random.random() > user_profile["exploration_chance"]:
        return

    try:
        current = get_mouse_position(page)
        start_x = current.get("x", 500)
        start_y = current.get("y", 300)

        for _ in range(random.randint(1, 3)):
            scan_x = max(120, min(1320, start_x + random.randint(-170, 170)))
            scan_y = max(100, min(1080, start_y + random.randint(-120, 120)))
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
    start_x = current.get("x", 500)
    start_y = current.get("y", 300)

    target_x = box["x"] + random.randint(8, max(10, int(box["width"] - 8)))
    target_y = box["y"] + random.randint(8, max(10, int(box["height"] - 8)))

    mid_x = (start_x + target_x) / 2 + random.randint(-60, 60)
    mid_y = (start_y + target_y) / 2 + random.randint(-45, 45)

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

    if prefer_right_side:
        click_x = box["x"] + box["width"] - random.randint(28, 48)
    else:
        click_x = box["x"] + random.uniform(20, max(24, box["width"] - 20))

    click_y = box["y"] + random.uniform(16, max(20, box["height"] - 16))

    page.mouse.move(click_x, click_y, steps=random.randint(3, 7))
    update_mouse_position(page, click_x, click_y)
    time.sleep(random.uniform(0.10, 0.25))
    page.mouse.click(click_x, click_y)
    time.sleep(random.uniform(0.20, 0.50))

    return True


def human_click(page, locator, user_profile, force=False):
    human_mouse_move_to_element(page, locator, user_profile)
    time.sleep(random.uniform(0.12, 0.35))
    locator.click(force=force)
    time.sleep(random.uniform(0.20, 0.48))


# ------------------------------------------------------------
# Locator helpers
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


def wait_for_live_form(page):
    print("[Debug] Waiting for Cacophinney callback form")

    # First, check if there's a landing page with a start button (like GoodNews360)
    landing_candidates = [
        page.get_by_text(re.compile(r"Get Started|Start.*Survey|Begin.*Application|Start.*Free", re.I)),
        page.get_by_role("button", name=re.compile(r"Get Started|Start|Begin|Continue", re.I)),
    ]

    for locator in landing_candidates:
        try:
            if locator.first.is_visible(timeout=3000):
                print("[Debug] Found landing page start button, clicking it")
                locator.first.click(timeout=3000)
                time.sleep(random.uniform(1.0, 2.0))
                break
        except Exception:
            pass

    # Now look for the form with expanded selectors
    selectors = [
        'input[name*="first" i]',
        'input[id*="first" i]',
        'input[placeholder*="First" i]',
        'input[autocomplete="given-name"]',
        'input[type="text"]',  # Generic text input as fallback
        'form input',  # Any input inside a form
    ]

    for selector in selectors:
        try:
            page.wait_for_selector(selector, timeout=10000, state="visible")
            print(f"[Debug] Found form using selector: {selector}")
            return True
        except Exception:
            pass

    # Try label-based matching
    try:
        locator = page.get_by_label(re.compile(r"first\s*name|name|full\s*name", re.I))
        locator.wait_for(timeout=10000, state="visible")
        print("[Debug] Found form using label matching")
        return True
    except Exception:
        pass

    # Try finding any visible text input as last resort
    try:
        inputs = page.locator('input[type="text"]:visible').all()
        if len(inputs) > 0:
            print(f"[Debug] Found {len(inputs)} visible text inputs")
            return True
    except Exception:
        pass

    return False


def get_text_input(page, field_name):
    field_name = field_name.lower().strip()

    if field_name == "first_name":
        return first_existing_locator(
            page,
            [
                page.locator('input[name="first_name"]'),
                page.locator('input[name="firstName"]'),
                page.locator('input[name="first"]'),
                page.locator('input[id*="first" i]'),
                page.locator('input[autocomplete="given-name"]'),
                page.locator('input[placeholder*="first" i]'),
            ],
        )

    if field_name == "last_name":
        return first_existing_locator(
            page,
            [
                page.locator('input[name="last_name"]'),
                page.locator('input[name="lastName"]'),
                page.locator('input[name="last"]'),
                page.locator('input[id*="last" i]'),
                page.locator('input[autocomplete="family-name"]'),
                page.locator('input[placeholder*="last" i]'),
            ],
        )

    if field_name == "email":
        return first_existing_locator(
            page,
            [
                page.locator('input[name="email"]'),
                page.locator('input[id="email"]'),
                page.locator('input[type="email"]'),
                page.locator('input[autocomplete="email"]'),
                page.locator('input[placeholder*="email" i]'),
            ],
        )

    if field_name == "mobile_phone":
        return first_existing_locator(
            page,
            [
                page.locator('input[name="phone"]'),
                page.locator('input[name="mobile_phone"]'),
                page.locator('input[name="mobile"]'),
                page.locator('input[id="phone"]'),
                page.locator('input[type="tel"]'),
                page.locator('input[autocomplete="tel"]'),
                page.locator('input[placeholder*="phone" i]'),
            ],
        )

    return None


def get_tax_debt_dropdown(page):
    return first_visible_locator(
        page,
        [
            page.locator('xpath=//label[contains(normalize-space(.), "Tax debt amount")]/following::*[contains(@class, "custom-select-trigger")][1]'),
            page.locator('xpath=//*[contains(normalize-space(.), "Tax debt amount")]/following::*[contains(@class, "custom-select-trigger")][1]'),
            page.locator('.custom-select-trigger').filter(has_text=re.compile(r"Select", re.I)),
            page.locator('[role="combobox"]').filter(has_text=re.compile(r"Select", re.I)),
            page.locator('button').filter(has_text=re.compile(r"Select", re.I)),
        ],
    )


def find_open_dropdown_panel(page):
    candidates = [
        page.locator('.custom-select-options.open'),
        page.locator('.custom-select-options'),
        page.locator('.custom-select-menu'),
        page.locator('.custom-select-dropdown'),
        page.locator('[role="listbox"]'),
    ]

    return first_visible_locator(page, candidates)


def find_visible_dropdown_option(page, label):
    label = clean_text(label)
    escaped_label = re.escape(label)

    candidates = [
        page.locator('.custom-select-option').filter(has_text=re.compile(rf"^{escaped_label}$", re.I)),
        page.locator('.custom-select-option').filter(has_text=re.compile(rf"{escaped_label}", re.I)),
        page.locator('[role="option"]').filter(has_text=re.compile(rf"^{escaped_label}$", re.I)),
        page.locator('[role="option"]').filter(has_text=re.compile(rf"{escaped_label}", re.I)),
        page.get_by_text(re.compile(rf"^{escaped_label}$", re.I)),
    ]

    return first_visible_locator(page, candidates)


def select_tax_debt_amount(page, value, user_profile):
    value = normalize_tax_debt_value(value)

    if not value:
        return

    dropdown = get_tax_debt_dropdown(page)

    if not dropdown:
        print(f"[Debug] Tax debt dropdown missing for value: {value}")
        return

    print(f"[Debug] Human-selecting tax debt amount: {value}")

    try:
        opened = mouse_click_locator_center(page, dropdown, user_profile, prefer_right_side=True)

        if not opened:
            print("[Debug] Could not click tax debt dropdown trigger")
            return

        time.sleep(random.uniform(0.50, 0.90))

        option_locator = find_visible_dropdown_option(page, value)

        if not option_locator:
            panel = find_open_dropdown_panel(page)

            if panel:
                box = panel.bounding_box()

                if box:
                    page.mouse.move(
                        box["x"] + box["width"] * 0.65,
                        box["y"] + box["height"] * 0.50,
                        steps=random.randint(4, 8),
                    )

                    for _ in range(8):
                        option_locator = find_visible_dropdown_option(page, value)
                        if option_locator:
                            break
                        page.mouse.wheel(0, random.randint(100, 180))
                        time.sleep(random.uniform(0.12, 0.25))

        if option_locator:
            mouse_click_locator_center(page, option_locator, user_profile)
            print(f"[Debug] Clicked tax debt option: {value}")
            time.sleep(random.uniform(0.35, 0.75))
            return

        print(f"[Debug] Could not visually find tax debt option '{value}'. Trying keyboard fallback.")
        target_index = TAX_DEBT_OPTIONS.index(value) if value in TAX_DEBT_OPTIONS else 0
        page.keyboard.press("Home")
        time.sleep(random.uniform(0.10, 0.22))

        for _ in range(target_index):
            page.keyboard.press("ArrowDown")
            time.sleep(random.uniform(0.08, 0.18))

        page.keyboard.press("Enter")
        time.sleep(random.uniform(0.35, 0.75))

    except Exception as error:
        print(f"[Debug] Tax debt dropdown selection failed: {error}")


# ------------------------------------------------------------
# Typing and validation
# ------------------------------------------------------------

def human_type(page, element, text, user_profile, reduced_mistake_chance=False, allow_typos=True):
    text = clean_text(text)

    human_mouse_move_to_element(page, element, user_profile)
    element.click()
    time.sleep(random.uniform(0.18, 0.45))

    if not text:
        return

    if not allow_typos:
        mistake_chance = 0.0
    elif reduced_mistake_chance:
        mistake_chance = 0.007
    else:
        mistake_chance = user_profile["mistake_chance"]

    print(f"[Debug] Typing '{text}' with mistake chance: {mistake_chance:.3f}")

    i = 0

    while i < len(text):
        char = text[i]

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

        i += 1

    time.sleep(random.uniform(0.25, 0.70))


def ensure_field_value(page, element, target_text, compare_digits=False):
    target_text = clean_text(target_text)

    if not target_text:
        return

    def get_value():
        try:
            return element.input_value()
        except Exception:
            return element.evaluate("el => el.value || el.textContent || ''")

    def digits_only(value):
        return "".join(ch for ch in clean_text(value) if ch.isdigit())

    try:
        current = get_value()
    except Exception:
        return

    if compare_digits:
        if digits_only(current) == digits_only(target_text):
            return
    else:
        if clean_text(current) == target_text:
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
            }
            """,
            target_text,
        )
    except Exception:
        pass


def click_consent_checkbox(page, user_profile):
    print("[Debug] Looking for Cacophinney consent checkbox")

    try:
        checkbox = first_existing_locator(
            page,
            [
                page.locator('input[name="tcpa_consent"]'),
                page.locator('input[id*="tcpa" i]'),
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
                const cb = document.querySelector('input[name="tcpa_consent"], input[id*="tcpa" i], input[type="checkbox"]');
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
            () => {
                const invalidFields = document.querySelectorAll(":invalid");
                const errors = [];

                invalidFields.forEach(field => {
                    errors.push({
                        name: field.name || field.id || field.tagName,
                        value: field.value || "",
                    });
                });

                return errors;
            }
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
    print("[Debug] Starting submit behavior")

    submit_button = first_visible_locator(
        page,
        [
            page.get_by_role("button", name=re.compile(r"request\s+my\s+free\s+review|request|submit", re.I)),
            page.locator('button[type="submit"]'),
            page.locator('input[type="submit"]'),
            page.locator("button").filter(has_text=re.compile(r"request|submit", re.I)),
        ],
    )

    if not submit_button:
        print("[Debug] Submit button not found")
        return False

    max_attempts = 2
    submission_successful = False

    for attempt in range(max_attempts):
        print(f"[Debug] Submit attempt {attempt + 1}/{max_attempts}")

        try:
            override_consent_footer(page, ip_address=ip_address, receipt_date=receipt_date)
            time.sleep(random.uniform(0.45, 0.90))

            human_mouse_move_to_element(page, submit_button, user_profile)
            time.sleep(random.uniform(0.25, 0.60))
            submit_button.click()
            print(f"[Debug] Submit clicked on attempt {attempt + 1}")

            time.sleep(random.uniform(1.0, 1.8))

            success_indicator = page.evaluate(
                """
                () => {
                    const text = document.body.innerText || "";

                    if (/thank you/i.test(text)) return { type: "thank_you" };
                    if (/received/i.test(text)) return { type: "received" };
                    if (/specialist.*reach out/i.test(text)) return { type: "specialist_reach_out" };
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

def force_set_cacophinney_required_fields(page, first_name, last_name, email, mobile_phone):
    """
    Hard correction for Cacophinney form fields.
    This prevents label/text ambiguity from sending values into the wrong input.
    """

    try:
        result = page.evaluate(
            """
            ({ firstName, lastName, email, phone }) => {
                const setValue = (selectorList, value) => {
                    for (const selector of selectorList) {
                        const el = document.querySelector(selector);

                        if (!el) continue;
                        if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA") continue;
                        if (el.type === "checkbox") continue;
                        if (el.type === "hidden") continue;

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

                const firstSet = setValue([
                    'input[name="first_name"]',
                    'input[name="firstName"]',
                    'input[name="first"]',
                    'input[id*="first" i]'
                ], firstName);

                const lastSet = setValue([
                    'input[name="last_name"]',
                    'input[name="lastName"]',
                    'input[name="last"]',
                    'input[id*="last" i]'
                ], lastName);

                const emailSet = setValue([
                    'input[name="email"]',
                    'input[id="email"]',
                    'input[type="email"]',
                    'input[autocomplete="email"]'
                ], email);

                const phoneSet = setValue([
                    'input[name="phone"]',
                    'input[name="mobile_phone"]',
                    'input[name="mobile"]',
                    'input[id="phone"]',
                    'input[type="tel"]',
                    'input[autocomplete="tel"]'
                ], phone);

                return { firstSet, lastSet, emailSet, phoneSet };
            }
            """,
            {
                "firstName": first_name,
                "lastName": last_name,
                "email": email,
                "phone": mobile_phone,
            },
        )

        print(f"[Debug] Force-set required fields result: {result}")

    except Exception as error:
        print(f"[Debug] Force-set required fields failed: {error}")

def fill_form_and_record(data, video_path):
    video_path = Path(video_path)
    video_path.parent.mkdir(exist_ok=True)

    user_profile = choose_user_profile()

    first_name = clean_text(data.get("First Name", ""))
    last_name = clean_text(data.get("Last Name", ""))
    mobile_phone = clean_text(data.get("Mobile Phone", ""))
    email = clean_text(data.get("Email", ""))
    tax_debt_amount = normalize_tax_debt_value(data.get("Tax Debt Amount", ""))
    contact_consent = clean_text(data.get("Contact Consent", "yes"))
    receipt_date = clean_text(data.get("Receipt Date", ""))
    ip_address = clean_text(data.get("IP Address", ""))

    print(f"[Debug] Receipt Date from row: '{receipt_date}'")
    print(f"[Debug] Tax Debt Amount from row: '{tax_debt_amount}'")

    if ip_address:
        print(f"[Debug] Using CSV IP Address: {ip_address}")
    else:
        print("[Debug] IP Address missing, using real browser/network IP from current environment")

    with sync_playwright() as p:
        headless = os.getenv("HEADLESS", "true").lower() not in ["false", "0", "no"]

        browser = p.chromium.launch(
            headless=headless,
            args=[
                "--disable-dev-shm-usage",
                "--no-sandbox",
            ],
        )

        context = browser.new_context(
            viewport={"width": 1440, "height": 1200},
            record_video_dir=str(video_path.parent),
            record_video_size={"width": 1440, "height": 1200},
        )

        def route_ip_api(route, request):
            try:
                url = request.url.lower()
                accept_header = request.headers.get("accept", "").lower()

                is_ip_lookup = re.search(
                    r"ipify|ip-api|ipinfo|api.*ip|/ip\b|checkip|icanhazip",
                    url,
                    re.I,
                )

                if ip_address and is_ip_lookup:
                    wants_json = (
                        "format=json" in url
                        or "json" in accept_header
                        or "ip-api" in url
                        or "ipinfo" in url
                    )

                    if wants_json:
                        return route.fulfill(
                            status=200,
                            body=f'{{"ip":"{ip_address}"}}',
                            headers={
                                "Content-Type": "application/json",
                                "Access-Control-Allow-Origin": "*",
                            },
                        )

                    return route.fulfill(
                        status=200,
                        body=ip_address,
                        headers={
                            "Content-Type": "text/plain",
                            "Access-Control-Allow-Origin": "*",
                        },
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

                if any(word in url.lower() for word in ["submit", "form", "lead", "callback", "contact", "api"]):
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
                status = response.status

                if any(word in url.lower() for word in ["submit", "form", "lead", "callback", "contact", "api"]):
                    print(f"[Network Response] {status} {url}")

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

        time.sleep(random.uniform(0.9, 1.8))

        form_ready = wait_for_live_form(page)

        if not form_ready:
            print("[Debug] Form not visible immediately. Scrolling toward qualify form.")
            page.mouse.wheel(0, 1200)
            time.sleep(random.uniform(0.8, 1.4))
            form_ready = wait_for_live_form(page)

        if not form_ready:
            # Debug: Capture screenshot and HTML before throwing error
            debug_path = VIDEOS_FOLDER / "cacophiney_form_debug.png"
            page.screenshot(path=str(debug_path))
            print(f"[Debug] Screenshot saved to: {debug_path}")
            print(f"[Debug] Current URL: {page.url}")
            print(f"[Debug] Page title: {page.title()}")

            # Save HTML for inspection
            html_path = VIDEOS_FOLDER / "cacophiney_form_debug.html"
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(page.content())
            print(f"[Debug] HTML saved to: {html_path}")

            # Check for iframes
            frames = page.frames
            print(f"[Debug] Number of frames on page: {len(frames)}")
            for i, frame in enumerate(frames):
                print(f"[Debug] Frame {i} URL: {frame.url}")

            # Check what text is visible on the page
            try:
                body_text = page.locator("body").inner_text()[:500]
                print(f"[Debug] First 500 chars of page text: {body_text}")
            except Exception as e:
                print(f"[Debug] Could not get body text: {e}")

            raise RuntimeError("Could not locate the Cacophinney callback form on the live site.")

        set_ip_address_on_page(page, ip_address)
        time.sleep(random.uniform(0.6, 1.2))

        fields = [
            {
                "type": "text",
                "field_name": "first_name",
                "value": first_name,
                "reduced_mistake": True,
                "compare_digits": False,
            },
            {
                "type": "text",
                "field_name": "last_name",
                "value": last_name,
                "reduced_mistake": True,
                "compare_digits": False,
            },
            {
                "type": "text",
                "field_name": "email",
                "value": email,
                "reduced_mistake": False,
                "compare_digits": False,
                
            },
            {
                "type": "text",
                "field_name": "mobile_phone",
                "value": mobile_phone,
                "reduced_mistake": False,
                "compare_digits": True,
            },
            {
                "type": "dropdown",
                "field_name": "tax_debt_amount",
                "value": tax_debt_amount,
            },
        ]

        for field in fields:
            random_click_somewhere(page, user_profile)

            if field["type"] == "text":
                if field.get("optional") and not field["value"]:
                    continue

                locator = get_text_input(page, field["field_name"])

                if not locator:
                    print(f"[Debug] Text field not found: {field['field_name']}")
                    continue

                human_type(
                    page,
                    locator,
                    field["value"],
                    user_profile,
                    reduced_mistake_chance=field["reduced_mistake"],
                    allow_typos=True,
                )

                ensure_field_value(
                    page,
                    locator,
                    field["value"],
                    compare_digits=field["compare_digits"],
                )

            elif field["type"] == "dropdown":
                select_tax_debt_amount(page, field["value"], user_profile)

            set_ip_address_on_page(page, ip_address)
            natural_mouse_idle(page, user_profile)
            time.sleep(random.uniform(0.35, 0.85))

        force_set_cacophinney_required_fields(
            page,
            first_name=first_name,
            last_name=last_name,
            email=email,
            mobile_phone=mobile_phone,
        )
        install_consent_footer_override_watcher(
            page,
            ip_address=ip_address,
            receipt_date=receipt_date,
        )

        if should_check_box(contact_consent, default_yes=True):
            click_consent_checkbox(page, user_profile)

        time.sleep(random.uniform(0.55, 1.05))

        set_ip_address_on_page(page, ip_address)
        override_consent_footer(page, ip_address=ip_address, receipt_date=receipt_date)

        validate_form_before_submit(page)

        # Hold briefly so the recorded video clearly captures the updated IP/date footer.
        time.sleep(random.uniform(1.2, 2.0))

        submit_form_with_retries(
            page,
            user_profile,
            ip_address=ip_address,
            receipt_date=receipt_date,
        )

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
