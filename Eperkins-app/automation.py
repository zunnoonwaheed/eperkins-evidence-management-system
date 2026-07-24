from playwright.sync_api import sync_playwright
from pathlib import Path
import subprocess
import random
import time
import re


SITE_URL = "https://www.myrpmcare.com/#eligibility"


US_STATE_OPTIONS = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID",
    "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS",
    "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK",
    "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV",
    "WI", "WY",
]

MEDICARE_OPTIONS = ["Yes", "No", "Not sure"]


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
        .replace("_", " ")
        .replace("?", "")
    )

def generate_random_ip():
    first_octet = random.choice([24, 50, 66, 72, 74, 98, 107, 173, 184, 198, 208])
    second_octet = random.randint(1, 254)
    third_octet = random.randint(1, 254)
    fourth_octet = random.randint(1, 254)

    return f"{first_octet}.{second_octet}.{third_octet}.{fourth_octet}"

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


def set_ip_address_on_page(page, target_ip):
    target_ip = clean_text(target_ip)

    if not target_ip:
        return

    safe_ip = target_ip.replace("\\", "\\\\").replace('"', '\\"')

    try:
        page.evaluate(
            f"""
            () => {{
                const TARGET_IP = "{safe_ip}";

                const selectors = [
                    'input[name*="ip" i]',
                    'input[id*="ip" i]',
                    'textarea[name*="ip" i]',
                    'textarea[id*="ip" i]',
                    'input[name="email-2"]',
                    'input[data-field*="ip" i]',
                    'input[placeholder*="ip" i]'
                ];

                const setField = (el) => {{
                    if (!el) return false;

                    if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA") {{
                        return false;
                    }}

                    el.value = TARGET_IP;
                    el.setAttribute("value", TARGET_IP);
                    el.dispatchEvent(new Event("input", {{ bubbles: true }}));
                    el.dispatchEvent(new Event("change", {{ bubbles: true }}));
                    el.dispatchEvent(new Event("blur", {{ bubbles: true }}));

                    return true;
                }};

                const trySet = () => {{
                    let changed = false;

                    selectors.forEach((selector) => {{
                        document.querySelectorAll(selector).forEach((el) => {{
                            if (setField(el)) changed = true;
                        }});
                    }});

                    const labels = Array.from(document.querySelectorAll("label"))
                        .filter((label) => /\\bip\\s*address\\b/i.test(label.textContent || ""));

                    labels.forEach((label) => {{
                        let input = null;

                        const forId = label.getAttribute("for");

                        if (forId) {{
                            input = document.getElementById(forId);
                        }}

                        if (!input) {{
                            input =
                                label.closest("div")?.querySelector("input, textarea") ||
                                label.parentElement?.querySelector("input, textarea") ||
                                label.nextElementSibling?.querySelector?.("input, textarea");
                        }}

                        if (setField(input)) changed = true;
                    }});

                    window.__csvInjectedIp = TARGET_IP;

                    return changed;
                }};

                trySet();

                [300, 700, 1200, 2000, 3500, 5000, 8000].forEach((delay) => {{
                    setTimeout(trySet, delay);
                }});

                const observer = new MutationObserver(() => trySet());
                observer.observe(document.documentElement, {{
                    childList: true,
                    subtree: true,
                    attributes: true
                }});

                setTimeout(() => observer.disconnect(), 12000);
            }}
            """
        )
    except Exception as error:
        print(f"[Debug] IP injection failed: {error}")


def build_ip_init_script(target_ip):
    safe_ip = clean_text(target_ip).replace("\\", "\\\\").replace('"', '\\"')

    return f"""
        (() => {{
            try {{
                const TARGET_IP = "{safe_ip}";

                const setField = (el) => {{
                    if (!el) return false;

                    if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA") {{
                        return false;
                    }}

                    el.value = TARGET_IP;
                    el.setAttribute("value", TARGET_IP);
                    el.dispatchEvent(new Event("input", {{ bubbles: true }}));
                    el.dispatchEvent(new Event("change", {{ bubbles: true }}));

                    return true;
                }};

                const apply = () => {{
                    const selectors = [
                        'input[name*="ip" i]',
                        'input[id*="ip" i]',
                        'textarea[name*="ip" i]',
                        'textarea[id*="ip" i]',
                        'input[name="email-2"]',
                        'input[data-field*="ip" i]',
                        'input[placeholder*="ip" i]'
                    ];

                    selectors.forEach((selector) => {{
                        document.querySelectorAll(selector).forEach(setField);
                    }});

                    const labels = Array.from(document.querySelectorAll("label"))
                        .filter((label) => /\\bip\\s*address\\b/i.test(label.textContent || ""));

                    labels.forEach((label) => {{
                        let input = null;

                        const forId = label.getAttribute("for");

                        if (forId) input = document.getElementById(forId);

                        if (!input) {{
                            input =
                                label.closest("div")?.querySelector("input, textarea") ||
                                label.parentElement?.querySelector("input, textarea") ||
                                label.nextElementSibling?.querySelector?.("input, textarea");
                        }}

                        setField(input);
                    }});

                    window.__csvInjectedIp = TARGET_IP;
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


def should_check_box(value, default_yes=True):
    value = clean_text(value)

    if not value:
        return default_yes

    return value.lower() not in ["no", "false", "0", "unchecked", "skip"]


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
# Human profile system
# ------------------------------------------------------------

USER_PROFILES = [
    {
        "name": "mouse-heavy",
        "mistake_chance": 0.08,
        "tab_chance": 0.10,
        "random_clicks": True,
        "exploration_chance": 0.75,
        "idle_movement_chance": 0.45,
    },
    {
        "name": "keyboard-efficient",
        "mistake_chance": 0.025,
        "tab_chance": 0.85,
        "random_clicks": False,
        "exploration_chance": 0.35,
        "idle_movement_chance": 0.25,
    },
    {
        "name": "mixed",
        "mistake_chance": 0.05,
        "tab_chance": 0.50,
        "random_clicks": random.random() < 0.35,
        "exploration_chance": 0.60,
        "idle_movement_chance": 0.35,
    },
]


def choose_user_profile():
    profile = random.choice(USER_PROFILES)
    print(f"[Profile] Simulating user: {profile['name']}")
    return profile


# ------------------------------------------------------------
# Cursor injection
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
            f"""
            () => {{
                window.__mouseX = {float(x)};
                window.__mouseY = {float(y)};
            }}
            """
        )
    except Exception:
        pass


# ------------------------------------------------------------
# Human-like mouse behavior
# ------------------------------------------------------------

def random_click_somewhere(page, user_profile):
    if not user_profile["random_clicks"]:
        return

    if random.random() < 0.15:
        x = random.randint(220, 1150)
        y = random.randint(160, 900)

        print(f"[Fidget Click] Random click at ({x}, {y})")

        page.mouse.move(x, y, steps=random.randint(3, 8))
        update_mouse_position(page, x, y)

        time.sleep(random.uniform(0.06, 0.18))
        page.mouse.click(x, y)
        time.sleep(random.uniform(0.12, 0.35))


def natural_mouse_idle(page, user_profile):
    if random.random() > user_profile["idle_movement_chance"]:
        return

    current = get_mouse_position(page)
    current_x = current.get("x", 500)
    current_y = current.get("y", 300)

    idle_x = max(60, min(1380, current_x + random.randint(-24, 24)))
    idle_y = max(60, min(1140, current_y + random.randint(-18, 18)))

    page.mouse.move(idle_x, idle_y, steps=random.randint(1, 3))
    update_mouse_position(page, idle_x, idle_y)

    time.sleep(random.uniform(0.05, 0.16))


def exploratory_form_behavior(page, target_element, user_profile):
    if random.random() > user_profile["exploration_chance"]:
        return

    try:
        current = get_mouse_position(page)
        start_x = current.get("x", 500)
        start_y = current.get("y", 300)

        exploration_type = random.random()

        if exploration_type < 0.34:
            scan_points = []

            for _ in range(random.randint(2, 4)):
                scan_x = max(120, min(1320, start_x + random.randint(-220, 220)))
                scan_y = max(100, min(1080, start_y + random.randint(-170, 170)))
                scan_points.append((scan_x, scan_y))

            for scan_x, scan_y in scan_points:
                page.mouse.move(scan_x, scan_y, steps=random.randint(4, 9))
                update_mouse_position(page, scan_x, scan_y)
                time.sleep(random.uniform(0.10, 0.32))

        elif exploration_type < 0.67:
            direction = random.choice(["horizontal", "vertical"])
            movements = random.randint(2, 5)

            for i in range(movements):
                if direction == "horizontal":
                    x = start_x + random.randint(-120, 120) * (1 if i % 2 == 0 else -1)
                    y = start_y + random.randint(-35, 35)
                else:
                    x = start_x + random.randint(-35, 35)
                    y = start_y + random.randint(-100, 100) * (1 if i % 2 == 0 else -1)

                x = max(120, min(1320, x))
                y = max(100, min(1080, y))

                page.mouse.move(x, y, steps=random.randint(4, 10))
                update_mouse_position(page, x, y)
                time.sleep(random.uniform(0.13, 0.38))

        else:
            box = target_element.bounding_box()

            if box:
                section_x = box["x"] + random.randint(-120, 120)
                section_y = box["y"] + random.randint(-90, 90)

                section_x = max(80, min(1360, section_x))
                section_y = max(80, min(1120, section_y))

                page.mouse.move(section_x, section_y, steps=random.randint(6, 12))
                update_mouse_position(page, section_x, section_y)
                time.sleep(random.uniform(0.18, 0.48))

    except Exception as error:
        print(f"[Debug] Exploratory behavior skipped: {error}")


def realistic_direct_move(page, start_x, start_y, target_x, target_y):
    steps = random.randint(10, 22)
    page.mouse.move(target_x, target_y, steps=steps)

    time.sleep(random.uniform(0.05, 0.16))

    if random.random() < 0.42:
        correction_x = target_x + random.randint(-5, 5)
        correction_y = target_y + random.randint(-4, 4)

        page.mouse.move(correction_x, correction_y, steps=random.randint(1, 3))

        target_x = correction_x
        target_y = correction_y

        time.sleep(random.uniform(0.03, 0.10))

    update_mouse_position(page, target_x, target_y)


def realistic_curved_move(page, start_x, start_y, target_x, target_y):
    mid_x = (start_x + target_x) / 2 + random.randint(-80, 80)
    mid_y = (start_y + target_y) / 2 + random.randint(-60, 60)

    page.mouse.move(mid_x, mid_y, steps=random.randint(14, 26))
    update_mouse_position(page, mid_x, mid_y)

    time.sleep(random.uniform(0.08, 0.23))

    page.mouse.move(target_x, target_y, steps=random.randint(9, 18))
    update_mouse_position(page, target_x, target_y)

    time.sleep(random.uniform(0.05, 0.16))


def realistic_two_stage_move(page, start_x, start_y, target_x, target_y):
    intermediate_x = start_x + (target_x - start_x) * random.uniform(0.52, 0.76)
    intermediate_y = start_y + (target_y - start_y) * random.uniform(0.52, 0.76)

    intermediate_x += random.randint(-40, 40)
    intermediate_y += random.randint(-35, 35)

    page.mouse.move(intermediate_x, intermediate_y, steps=random.randint(13, 22))
    update_mouse_position(page, intermediate_x, intermediate_y)

    time.sleep(random.uniform(0.10, 0.28))

    page.mouse.move(target_x, target_y, steps=random.randint(8, 14))
    update_mouse_position(page, target_x, target_y)

    time.sleep(random.uniform(0.05, 0.14))


def realistic_overshoot_move(page, start_x, start_y, target_x, target_y):
    overshoot_x = target_x + random.randint(-90, 90)
    overshoot_y = target_y + random.randint(-80, 80)

    overshoot_x = max(60, min(1380, overshoot_x))
    overshoot_y = max(60, min(1140, overshoot_y))

    page.mouse.move(overshoot_x, overshoot_y, steps=random.randint(18, 30))
    update_mouse_position(page, overshoot_x, overshoot_y)

    time.sleep(random.uniform(0.06, 0.16))

    page.mouse.move(target_x, target_y, steps=random.randint(5, 10))
    update_mouse_position(page, target_x, target_y)

    time.sleep(random.uniform(0.04, 0.12))


def human_mouse_move_to_element(page, element, user_profile):
    try:
        element.scroll_into_view_if_needed(timeout=3000)
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

    distance = ((target_x - start_x) ** 2 + (target_y - start_y) ** 2) ** 0.5
    movement_type = random.random()

    if distance < 80:
        realistic_direct_move(page, start_x, start_y, target_x, target_y)
    elif movement_type < 0.35:
        realistic_curved_move(page, start_x, start_y, target_x, target_y)
    elif movement_type < 0.62:
        realistic_two_stage_move(page, start_x, start_y, target_x, target_y)
    else:
        realistic_overshoot_move(page, start_x, start_y, target_x, target_y)

    hover_time = random.uniform(0.25, 0.75)
    time.sleep(hover_time)


def human_click(page, locator, user_profile, force=False):
    human_mouse_move_to_element(page, locator, user_profile)
    time.sleep(random.uniform(0.15, 0.45))
    locator.click(force=force)
    time.sleep(random.uniform(0.22, 0.58))


# ------------------------------------------------------------
# Locator helpers for live site
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
    print("[Debug] Waiting for live eligibility form")

    selectors = [
        'input[name*="first" i]',
        'input[id*="first" i]',
        'input[placeholder*="First" i]',
        'input[autocomplete="given-name"]',
    ]

    for selector in selectors:
        try:
            page.wait_for_selector(selector, timeout=7000)
            return True
        except Exception:
            pass

    try:
        locator = page.get_by_label(re.compile(r"first\s*name", re.I))
        locator.wait_for(timeout=7000)
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
                page.get_by_label(re.compile(r"first\s*name", re.I)),
                page.locator('input[name*="first" i]'),
                page.locator('input[id*="first" i]'),
                page.locator('input[autocomplete="given-name"]'),
                page.locator('input[placeholder*="first" i]'),
            ],
        )

    if field_name == "last_name":
        return first_existing_locator(
            page,
            [
                page.get_by_label(re.compile(r"last\s*name", re.I)),
                page.locator('input[name*="last" i]'),
                page.locator('input[id*="last" i]'),
                page.locator('input[autocomplete="family-name"]'),
                page.locator('input[placeholder*="last" i]'),
            ],
        )

    if field_name == "mobile_phone":
        return first_existing_locator(
            page,
            [
                page.get_by_label(re.compile(r"mobile\s*phone|phone", re.I)),
                page.locator('input[type="tel"]'),
                page.locator('input[name*="phone" i]'),
                page.locator('input[id*="phone" i]'),
                page.locator('input[placeholder*="555" i]'),
            ],
        )

    if field_name == "email":
        return first_existing_locator(
            page,
            [
                page.get_by_label(re.compile(r"email", re.I)),
                page.locator('input[type="email"]'),
                page.locator('input[name*="email" i]'),
                page.locator('input[id*="email" i]'),
                page.locator('input[placeholder*="example.com" i]'),
            ],
        )

    return None


def get_textarea(page, field_name):
    field_name = field_name.lower().strip()

    if field_name == "ongoing_conditions":
        return first_existing_locator(
            page,
            [
                page.get_by_label(re.compile(r"ongoing\s*conditions|conditions", re.I)),
                page.locator('textarea[name*="condition" i]'),
                page.locator('textarea[id*="condition" i]'),
                page.locator('textarea[placeholder*="blood pressure" i]'),
                page.locator("textarea"),
            ],
        )

    return None


def get_select(page, field_name):
    field_name = field_name.lower().strip()

    if field_name == "state":
        return first_visible_locator(
            page,
            [
                # Correct visible custom dropdown trigger for State
                page.locator('#state').locator(
                    'xpath=following-sibling::*[contains(@class, "custom-select-trigger")][1]'
                ),
                page.locator(
                    'xpath=//select[@id="state"]/following::*[contains(@class, "custom-select-trigger")][1]'
                ),
                page.locator(
                    'xpath=//label[contains(normalize-space(.), "State")]/following::*[contains(@class, "custom-select-trigger")][1]'
                ),

                # Fallbacks
                page.locator('.custom-select-trigger').nth(0),
                page.locator('[role="combobox"]').nth(0),
            ],
        )

    if field_name == "has_medicare":
        return first_visible_locator(
            page,
            [
                # Correct visible custom dropdown trigger for Medicare
                page.locator('#medicare').locator(
                    'xpath=following-sibling::*[contains(@class, "custom-select-trigger")][1]'
                ),
                page.locator(
                    'xpath=//select[@id="medicare"]/following::*[contains(@class, "custom-select-trigger")][1]'
                ),
                page.locator(
                    'xpath=//label[contains(normalize-space(.), "Have Medicare")]/following::*[contains(@class, "custom-select-trigger")][1]'
                ),

                # Fallbacks
                page.locator('.custom-select-trigger').nth(1),
                page.locator('[role="combobox"]').nth(1),
            ],
        )

    return None


def infer_dropdown_options(value):
    normalized = normalize_choice(value)

    if normalized in ["yes", "no", "not sure", "notsure"]:
        return ["Select..."] + MEDICARE_OPTIONS

    upper_value = clean_text(value).upper()

    if upper_value in US_STATE_OPTIONS:
        return ["Select..."] + US_STATE_OPTIONS

    return []


def find_visible_dropdown_option(page, label):
    label = clean_text(label)
    escaped_label = re.escape(label)

    candidates = [
        page.locator('.custom-select-option').filter(
            has_text=re.compile(rf"^{escaped_label}$", re.I)
        ),
        page.locator('.custom-select-option').filter(
            has_text=re.compile(rf"{escaped_label}", re.I)
        ),
        page.locator('[role="option"]').filter(
            has_text=re.compile(rf"^{escaped_label}$", re.I)
        ),
        page.locator('[role="option"]').filter(
            has_text=re.compile(rf"{escaped_label}", re.I)
        ),
    ]

    return first_visible_locator(page, candidates)

def find_open_dropdown_panel(page):
    candidates = [
        page.locator('.custom-select-options.open'),
        page.locator('.custom-select-options'),
        page.locator('.custom-select-menu'),
        page.locator('.custom-select-dropdown'),
        page.locator('[role="listbox"]'),
    ]

    return first_visible_locator(page, candidates)

# ------------------------------------------------------------
# Human-like typing
# ------------------------------------------------------------

def human_type(page, element, text, user_profile, reduced_mistake_chance=False, allow_typos=True):
    text = clean_text(text)

    human_mouse_move_to_element(page, element, user_profile)

    element.click()

    time.sleep(random.uniform(0.22, 0.52))

    if not text:
        return

    if random.random() < 0.30:
        distraction_type = random.random()

        if distraction_type < 0.60:
            distraction_x = random.randint(260, 1180)
            distraction_y = random.randint(160, 900)

            page.mouse.move(distraction_x, distraction_y, steps=random.randint(3, 8))
            update_mouse_position(page, distraction_x, distraction_y)

            time.sleep(random.uniform(0.10, 0.30))

            box = element.bounding_box()

            if box:
                return_x = box["x"] + random.randint(-35, 35)
                return_y = box["y"] + random.randint(-24, 24)

                page.mouse.move(return_x, return_y, steps=random.randint(2, 6))
                update_mouse_position(page, return_x, return_y)

                time.sleep(random.uniform(0.06, 0.18))
        else:
            time.sleep(random.uniform(0.20, 0.55))

    if not allow_typos:
        mistake_chance = 0.0
    elif reduced_mistake_chance:
        mistake_chance = 0.008
    else:
        mistake_chance = user_profile["mistake_chance"]

    print(f"[Debug] Typing '{text}' with mistake chance: {mistake_chance:.3f}")

    i = 0

    while i < len(text):
        char = text[i]

        if allow_typos and random.random() < mistake_chance and i > 0:
            mistake_type = random.random()

            if mistake_type < 0.50:
                wrong_chars = "abcdefghijklmnopqrstuvwxyz0123456789"
                previous_char = text[i - 1].lower()

                if previous_char in "qwertyuiop":
                    wrong_chars = "qwertyuiop"
                elif previous_char in "asdfghjkl":
                    wrong_chars = "asdfghjkl"
                elif previous_char in "zxcvbnm":
                    wrong_chars = "zxcvbnm"

                wrong_char = random.choice(wrong_chars)

                element.type(wrong_char)
                time.sleep(random.uniform(0.05, 0.15))
                element.press("Backspace")
                time.sleep(random.uniform(0.05, 0.16))

                print(f"[Debug] Typo corrected: '{wrong_char}'")

            elif mistake_type < 0.75:
                wrong_count = random.randint(2, 3)
                wrong_text = ""

                for _ in range(wrong_count):
                    wrong_char = random.choice("abcdefghijklmnopqrstuvwxyz0123456789")
                    element.type(wrong_char)
                    wrong_text += wrong_char
                    time.sleep(random.uniform(0.05, 0.13))

                time.sleep(random.uniform(0.18, 0.42))

                for _ in range(wrong_count):
                    element.press("Backspace")
                    time.sleep(random.uniform(0.07, 0.16))

                print(f"[Debug] Multi-char typo corrected: '{wrong_text}'")

            elif mistake_type < 0.90:
                max_backspace = min(4, i)

                if max_backspace >= 2:
                    backspace_count = random.randint(2, max_backspace)

                    print(f"[Debug] Correcting {backspace_count} chars back")

                    for _ in range(backspace_count):
                        element.press("Backspace")
                        time.sleep(random.uniform(0.08, 0.18))

                    i = max(0, i - backspace_count)
                    time.sleep(random.uniform(0.25, 0.65))
                    continue

            else:
                element.type(char)
                time.sleep(random.uniform(0.05, 0.13))
                time.sleep(random.uniform(0.10, 0.28))
                element.press("Backspace")
                time.sleep(random.uniform(0.05, 0.13))

                print("[Debug] Double-type corrected")

        element.type(char)

        if char == " ":
            time.sleep(random.uniform(0.12, 0.34))
        elif char in ".,@-/()":
            time.sleep(random.uniform(0.09, 0.24))
        else:
            time.sleep(random.uniform(0.045, 0.17))

        i += 1

    time.sleep(random.uniform(0.38, 1.0))


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
        time.sleep(random.uniform(0.15, 0.35))
        return
    except Exception:
        pass

    escaped = target_text.replace("\\", "\\\\").replace('"', '\\"')

    try:
        element.evaluate(
            f"""
            (el) => {{
                if ("value" in el) {{
                    el.value = "{escaped}";
                }}
                el.dispatchEvent(new Event("input", {{ bubbles: true }}));
                el.dispatchEvent(new Event("change", {{ bubbles: true }}));
            }}
            """
        )
        time.sleep(random.uniform(0.10, 0.24))
    except Exception:
        pass


# ------------------------------------------------------------
# Form-specific behavior
# ------------------------------------------------------------

def mouse_click_locator_center(page, locator, user_profile, prefer_right_side=False):
    """
    Clicks by actual mouse coordinates instead of locator.click().
    This avoids Playwright's auto-scroll/click retry behavior that caused
    the hidden select to fight with the visible custom dropdown.
    """

    human_mouse_move_to_element(page, locator, user_profile)

    box = locator.bounding_box()

    if not box:
        return False

    if prefer_right_side:
        click_x = box["x"] + box["width"] - random.randint(28, 48)
    else:
        click_x = box["x"] + random.uniform(24, max(28, box["width"] - 24))

    click_y = box["y"] + random.uniform(18, max(22, box["height"] - 18))

    page.mouse.move(click_x, click_y, steps=random.randint(3, 7))
    update_mouse_position(page, click_x, click_y)

    time.sleep(random.uniform(0.12, 0.32))
    page.mouse.click(click_x, click_y)
    time.sleep(random.uniform(0.22, 0.55))

    return True


def scroll_dropdown_panel_like_human(page, panel, user_profile, direction="down"):
    """
    Scrolls inside the open dropdown panel, not the main page.
    """

    if not panel:
        return

    box = panel.bounding_box()

    if not box:
        return

    move_x = box["x"] + min(box["width"] - 20, max(20, box["width"] * random.uniform(0.45, 0.70)))
    move_y = box["y"] + min(box["height"] - 20, max(20, box["height"] * random.uniform(0.45, 0.70)))

    page.mouse.move(move_x, move_y, steps=random.randint(4, 9))
    update_mouse_position(page, move_x, move_y)

    time.sleep(random.uniform(0.10, 0.28))

    amount = random.randint(120, 220)

    if direction == "up":
        amount = -amount

    page.mouse.wheel(0, amount)
    time.sleep(random.uniform(0.18, 0.42))

    if random.random() < 0.18:
        natural_mouse_idle(page, user_profile)


def select_dropdown_option(page, dropdown, value, user_profile):
    value = clean_text(value)

    if not value:
        return

    if dropdown is None:
        print(f"[Debug] Dropdown missing for value: {value}")
        return

    print(f"[Debug] Human-selecting real custom dropdown value: {value}")

    expected_options = infer_dropdown_options(value)
    normalized_target = normalize_choice(value)

    target_label = value
    target_index = None

    if expected_options:
        for i, label in enumerate(expected_options):
            if normalize_choice(label) == normalized_target:
                target_label = label
                target_index = i
                break

    if target_index is None:
        target_index = 0

    try:
        # Click the visible custom trigger, not the hidden native select.
        opened = mouse_click_locator_center(
            page,
            dropdown,
            user_profile,
            prefer_right_side=True,
        )

        if not opened:
            print("[Debug] Could not click dropdown trigger")
            return

        print("[Debug] Real custom dropdown opened")
        time.sleep(random.uniform(0.65, 1.15))

        # Give the site time to render the real dropdown panel.
        panel = find_open_dropdown_panel(page)

        if not panel:
            print("[Debug] Dropdown panel not found after click. Trying one more trigger click.")
            mouse_click_locator_center(
                page,
                dropdown,
                user_profile,
                prefer_right_side=True,
            )
            time.sleep(random.uniform(0.50, 0.90))
            panel = find_open_dropdown_panel(page)

        if not panel:
            print("[Debug] Dropdown panel still not found")
            return

        # Try to find the option immediately.
        option_locator = find_visible_dropdown_option(page, target_label)

        # If not visible, scroll inside the dropdown box only.
        if not option_locator:
            print(f"[Debug] Target option '{target_label}' not visible. Scrolling dropdown panel.")

            max_scroll_attempts = 45

            for attempt in range(max_scroll_attempts):
                option_locator = find_visible_dropdown_option(page, target_label)

                if option_locator:
                    print(f"[Debug] Found option '{target_label}' after {attempt} scroll attempts")
                    break

                scroll_dropdown_panel_like_human(
                    page,
                    panel,
                    user_profile,
                    direction="down",
                )

            option_locator = find_visible_dropdown_option(page, target_label)

        if not option_locator:
            print(f"[Debug] Could not find option '{target_label}' visually. Trying keyboard fallback.")

            try:
                # Keyboard fallback still operates on the real open dropdown.
                page.keyboard.press("Home")
                time.sleep(random.uniform(0.15, 0.32))

                for _ in range(target_index):
                    page.keyboard.press("ArrowDown")
                    time.sleep(random.uniform(0.10, 0.24))

                if random.random() < 0.12:
                    print("[Debug] Simulating dropdown overshoot correction")
                    page.keyboard.press("ArrowDown")
                    time.sleep(random.uniform(0.12, 0.24))
                    page.keyboard.press("ArrowUp")
                    time.sleep(random.uniform(0.12, 0.24))

                time.sleep(random.uniform(0.25, 0.58))
                page.keyboard.press("Enter")
                time.sleep(random.uniform(0.40, 0.85))

                print(f"[Debug] Keyboard-selected dropdown option: {target_label}")
                return

            except Exception as keyboard_error:
                print(f"[Debug] Keyboard fallback failed: {keyboard_error}")
                return

        # Move to the real visible option and click it.
        mouse_click_locator_center(
            page,
            option_locator,
            user_profile,
            prefer_right_side=False,
        )

        print(f"[Debug] Clicked real dropdown option: {target_label}")

        time.sleep(random.uniform(0.45, 0.90))

        # Verify trigger text changed.
        try:
            selected_text = clean_text(dropdown.inner_text())
            print(f"[Debug] Dropdown trigger now shows: {selected_text}")

            if normalize_choice(target_label) not in normalize_choice(selected_text):
                print("[Debug] Dropdown trigger text did not match expected value yet")
        except Exception:
            pass

    except Exception as error:
        print(f"[Debug] Custom dropdown selection failed: {error}")

def click_checkbox_by_text_or_index(page, visible_text_hint, checkbox_index, user_profile):
    print(f"[Debug] Looking for checkbox: {visible_text_hint}")

    checkbox_clicked = False

    try:
        text_locator = page.locator(f"text={visible_text_hint}")

        if text_locator.count() > 0:
            print("[Debug] Checkbox method 1: clicking visible text")
            human_click(page, text_locator.first, user_profile)
            time.sleep(random.uniform(0.28, 0.72))

            checked_count = page.evaluate(
                """
                () => Array.from(document.querySelectorAll('input[type="checkbox"]'))
                    .filter(cb => cb.checked).length
                """
            )

            if checked_count >= checkbox_index + 1:
                checkbox_clicked = True
                print("[Debug] Checkbox text click successful")
    except Exception as error:
        print(f"[Debug] Checkbox text click failed: {error}")

    if not checkbox_clicked:
        try:
            checkbox = page.locator('input[type="checkbox"]').nth(checkbox_index)

            if checkbox.count() > 0:
                print("[Debug] Checkbox method 2: visual checkbox click")

                human_mouse_move_to_element(page, checkbox, user_profile)
                time.sleep(random.uniform(0.20, 0.50))

                box = checkbox.bounding_box()

                if box:
                    click_x = box["x"] + 8
                    click_y = box["y"] + box["height"] / 2

                    page.mouse.move(click_x, click_y, steps=random.randint(3, 8))
                    update_mouse_position(page, click_x, click_y)

                    time.sleep(random.uniform(0.10, 0.28))
                    page.mouse.click(click_x, click_y)
                    time.sleep(random.uniform(0.28, 0.70))

                    checkbox_clicked = True
        except Exception as error:
            print(f"[Debug] Checkbox visual click failed: {error}")

    if not checkbox_clicked:
        try:
            checkbox = page.locator('input[type="checkbox"]').nth(checkbox_index)

            print("[Debug] Checkbox method 3: force check")
            human_mouse_move_to_element(page, checkbox, user_profile)
            time.sleep(random.uniform(0.20, 0.50))
            checkbox.check(force=True)
            time.sleep(random.uniform(0.28, 0.70))
            checkbox_clicked = True

        except Exception as error:
            print(f"[Debug] Checkbox force check failed: {error}")

    if not checkbox_clicked:
        try:
            print("[Debug] Checkbox method 4: JS fallback")

            result = page.evaluate(
                """
                (index) => {
                    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
                    const checkbox = checkboxes[index];

                    if (!checkbox) return "not_found";

                    checkbox.checked = true;
                    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
                    checkbox.dispatchEvent(new Event("input", { bubbles: true }));
                    checkbox.dispatchEvent(new Event("click", { bubbles: true }));
                    return "success";
                }
                """,
                checkbox_index,
            )

            if result == "success":
                checkbox_clicked = True
        except Exception as error:
            print(f"[Debug] Checkbox JS fallback failed: {error}")

    try:
        is_checked = page.evaluate(
            """
            (index) => {
                const checkboxes = document.querySelectorAll('input[type="checkbox"]');
                const checkbox = checkboxes[index];
                return checkbox ? checkbox.checked : false;
            }
            """,
            checkbox_index,
        )

        print(f"[Debug] Final checkbox verification index {checkbox_index}: {is_checked}")

    except Exception:
        pass

    return checkbox_clicked


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

def hide_receipt_until_override(page):
    """
    Demo-only visual helper.
    Watches for the receipt and hides it before the user can see the unmodified version.
    """

    try:
        page.evaluate(
            """
            () => {
                window.__hideRPMCareReceipt = true;

                const normalize = (text) => (text || "").replace(/\\s+/g, " ").trim();

                const hideReceipt = () => {
                    if (!window.__hideRPMCareReceipt) return;

                    const candidates = Array.from(document.querySelectorAll("*"))
                        .filter((el) => {
                            const text = normalize(el.innerText || el.textContent || "");
                            return (
                                /CONSENT RECEIPT/i.test(text) &&
                                /Timestamp/i.test(text) &&
                                /Phone/i.test(text)
                            );
                        })
                        .sort((a, b) => {
                            const aLen = normalize(a.innerText || a.textContent || "").length;
                            const bLen = normalize(b.innerText || b.textContent || "").length;
                            return aLen - bLen;
                        });

                    const receipt = candidates[0];

                    if (receipt) {
                        receipt.style.opacity = "0";
                        receipt.style.pointerEvents = "none";
                        receipt.setAttribute("data-demo-hidden-receipt", "true");
                    }
                };

                window.__hideRPMCareReceiptNow = hideReceipt;

                hideReceipt();

                if (window.__rpmcareHideReceiptObserver) {
                    window.__rpmcareHideReceiptObserver.disconnect();
                }

                const observer = new MutationObserver(hideReceipt);

                observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true,
                    characterData: true
                });

                window.__rpmcareHideReceiptObserver = observer;
            }
            """
        )

        print("[Debug] Receipt hide observer installed")

    except Exception as error:
        print(f"[Debug] Could not install receipt hide observer: {error}")


def show_receipt_after_override(page):
    """
    Demo-only visual helper.
    Reveals the receipt after override has changed State -> IP and timestamp date.
    """

    try:
        page.evaluate(
            """
            () => {
                window.__hideRPMCareReceipt = false;

                if (window.__rpmcareHideReceiptObserver) {
                    window.__rpmcareHideReceiptObserver.disconnect();
                    window.__rpmcareHideReceiptObserver = null;
                }

                document.querySelectorAll('[data-demo-hidden-receipt="true"]').forEach((el) => {
                    el.style.opacity = "1";
                    el.style.pointerEvents = "";
                    el.removeAttribute("data-demo-hidden-receipt");
                });
            }
            """
        )

        print("[Debug] Receipt revealed after override")

    except Exception as error:
        print(f"[Debug] Could not reveal receipt after override: {error}")

def override_receipt_for_demo(page, ip_address="", receipt_date=""):
    """
    Demo-only visual override after receipt appears.

    - Replaces the visible State label with IP Address.
    - Replaces the State value with the CSV IP Address.
    - Changes timestamp date if Receipt Date exists.
    - Does not affect the real backend record.
    """

    ip_address = clean_text(ip_address)
    receipt_date = clean_text(receipt_date)

    try:
        

        result = page.evaluate(
            """
            ({ ipAddress, receiptDate }) => {
                const normalize = (text) => (text || "").replace(/\\s+/g, " ").trim();

                const isVisible = (el) => {
                    if (!el) return false;

                    const style = window.getComputedStyle(el);
                    const rect = el.getBoundingClientRect();

                    return (
                        style.display !== "none" &&
                        style.visibility !== "hidden" &&
                        rect.width > 0 &&
                        rect.height > 0
                    );
                };

                const ownText = (el) => {
                    if (!el) return "";

                    return normalize(
                        Array.from(el.childNodes)
                            .filter((node) => node.nodeType === Node.TEXT_NODE)
                            .map((node) => node.textContent || "")
                            .join(" ")
                    );
                };

                const hasVisibleChildren = (el) => {
                    return Array.from(el.children || []).some(isVisible);
                };

                const allVisible = Array.from(document.querySelectorAll("*")).filter(isVisible);

                const receiptCandidates = allVisible
                    .filter((el) => {
                        const text = normalize(el.innerText || el.textContent || "");

                        return (
                            /CONSENT RECEIPT/i.test(text) &&
                            /Name/i.test(text) &&
                            /Phone/i.test(text) &&
                            /State/i.test(text) &&
                            /Timestamp/i.test(text)
                        );
                    })
                    .sort((a, b) => {
                        const aLen = normalize(a.innerText || a.textContent || "").length;
                        const bLen = normalize(b.innerText || b.textContent || "").length;
                        return aLen - bLen;
                    });

                const receiptBox = receiptCandidates[0] || document.body;

                const receiptVisible = Array.from(receiptBox.querySelectorAll("*")).filter(isVisible);

                // Get the smallest visible text-bearing elements in visual/source order.
                const leafTextElements = receiptVisible.filter((el) => {
                    const text = normalize(el.innerText || el.textContent || "");
                    const direct = ownText(el);

                    if (!text) return false;

                    // Prefer elements that either have direct text or no visible child elements.
                    return direct || !hasVisibleChildren(el);
                });

                let stateReplaced = false;

                if (ipAddress) {
                    // Find exact State label element, not a parent row.
                    const stateLabelIndex = leafTextElements.findIndex((el) => {
                        const direct = ownText(el);
                        const full = normalize(el.innerText || el.textContent || "");

                        return direct === "State" || full === "State";
                    });

                    if (stateLabelIndex !== -1) {
                        const stateLabelEl = leafTextElements[stateLabelIndex];
                        const stateValueEl = leafTextElements[stateLabelIndex + 1];

                        stateLabelEl.textContent = "IP Address";

                        if (stateValueEl) {
                            stateValueEl.textContent = ipAddress;
                            stateReplaced = true;
                        }
                    }
                }

                let timestampChanged = false;

                if (receiptDate) {
                    const timestampRegex = /^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}/;

                    const timestampEl = leafTextElements.find((el) => {
                        const direct = ownText(el);
                        const full = normalize(el.innerText || el.textContent || "");

                        return timestampRegex.test(direct) || timestampRegex.test(full);
                    });

                    if (timestampEl) {
                        const current = normalize(timestampEl.innerText || timestampEl.textContent || "");
                        const timeMatch = current.match(/T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?Z?/);

                        timestampEl.textContent = timeMatch
                            ? `${receiptDate}${timeMatch[0]}`
                            : `${receiptDate}T12:00:00.000Z`;

                        timestampChanged = true;
                    }
                }

                return {
                    receiptBoxFound: Boolean(receiptBox),
                    stateReplaced,
                    timestampChanged,
                    ipAddress,
                    receiptDate
                };
            }
            """,
            {
                "ipAddress": ip_address,
                "receiptDate": receipt_date,
            },
        )

        print(f"[Debug] Demo receipt override result: {result}")
        

    except Exception as error:
        print(f"[Debug] Demo receipt override failed: {error}")

def submit_form_with_retries(page, user_profile, ip_address="", receipt_date=""):
    print("[Debug] Starting submit behavior")

    submit_button = first_visible_locator(
        page,
        [
            page.get_by_role("button", name=re.compile(r"submit.*request|submit", re.I)),
            page.locator('button[type="submit"]'),
            page.locator('input[type="submit"]'),
            page.locator("button").filter(has_text=re.compile(r"submit", re.I)),
        ],
    )

    if not submit_button:
        print("[Debug] Submit button not found")
        return False

    max_attempts = 3
    submission_successful = False

    for attempt in range(max_attempts):
        print(f"[Debug] Submit attempt {attempt + 1}/{max_attempts}")

        try:
            decision_pause = random.uniform(0.50, 1.25)
            print(f"[Debug] Decision pause before submit: {decision_pause:.2f}s")
            time.sleep(decision_pause)

            human_mouse_move_to_element(page, submit_button, user_profile)

            hover_time = random.uniform(0.30, 0.75)
            print(f"[Debug] Hovering over submit button: {hover_time:.2f}s")
            time.sleep(hover_time)

            submit_button.click()
            print(f"[Debug] Submit clicked on attempt {attempt + 1}")

            time.sleep(random.uniform(0.45, 0.90))

            max_wait_time = 8
            start_time = time.time()
            submission_detected = False

            while time.time() - start_time < max_wait_time and not submission_detected:
                current_url = page.url

                if "thank" in current_url.lower() or "submitted" in current_url.lower():
                    print("[Debug] Submission detected by URL")
                    submission_successful = True
                    submission_detected = True
                    break

                try:
                    success_indicator = page.evaluate(
                        """
                        () => {
                            const text = document.body.innerText || "";

                            if (/request submitted/i.test(text)) {
                                return { type: "success_text", text: "Request submitted" };
                            }

                            if (/request received/i.test(text)) {
                                return { type: "success_text", text: "Request received" };
                            }

                            if (/application submitted/i.test(text)) {
                                return { type: "success_text", text: "Application submitted" };
                            }

                            if (/thank you/i.test(text) && /received/i.test(text)) {
                                return { type: "thank_you_text", text: "Thank you / received" };
                            }

                            if (/thank you/i.test(text)) {
                                return { type: "thank_you_text", text: "Thank you" };
                            }

                            return null;
                        }
                        """
                    )

                    if success_indicator:
                        print(f"[Debug] Submission detected: {success_indicator}")

                        try:
                            page.wait_for_selector("text=CONSENT RECEIPT", timeout=5000)
                        except Exception:
                            pass

                        override_receipt_for_demo(
                            page,
                            ip_address=ip_address,
                            receipt_date=receipt_date,
                        )

                        show_receipt_after_override(page)

                        time.sleep(random.uniform(2.8, 4.0))

                        submission_successful = True
                        submission_detected = True
                        break

                except Exception as check_error:
                    print(f"[Debug] Submission check error: {check_error}")

                time.sleep(0.50)

            if submission_detected:
                time.sleep(random.uniform(1.4, 2.5))
                break

            if attempt < max_attempts - 1:
                print("[Debug] No confirmation detected, retrying submit")
                time.sleep(random.uniform(1.0, 2.0))

        except Exception as submit_error:
            print(f"[Debug] Submit attempt failed: {submit_error}")

            if attempt < max_attempts - 1:
                time.sleep(random.uniform(1.0, 2.0))

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
    state = clean_text(data.get("State", ""))
    has_medicare = clean_text(data.get("Has Medicare", ""))
    ongoing_conditions = clean_text(data.get("Ongoing Conditions", ""))
    contact_consent = clean_text(data.get("Contact Consent", "yes"))
    privacy_terms = clean_text(data.get("Privacy Terms", "yes"))
    tax_debt_consent = clean_text(data.get("Tax Debt Consent", "yes"))
    receipt_date = clean_text(data.get("Receipt Date", ""))
    print(f"[Debug] Receipt Date from row: '{receipt_date}'")

    ip_address = clean_text(data.get("IP Address", ""))

    if ip_address:
        print(f"[Debug] Using CSV IP Address: {ip_address}")
    else:
        print("[Debug] IP Address missing, using real browser/network IP from current environment")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
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
                url = request.url

                if re.search(r"ipify|ip-api|ipinfo|api.*ip|/ip\\b|checkip|icanhazip", url, re.I):
                    headers = {"Content-Type": "text/plain"}
                    return route.fulfill(status=200, body=ip_address, headers=headers)

            except Exception:
                pass

            return route.continue_()

        if ip_address:
            try:
                context.route("**/*", route_ip_api)
            except Exception as route_error:
                print(f"[Debug] Could not install IP route override: {route_error}")

        if ip_address:
            try:
                context.add_init_script(build_ip_init_script(ip_address))
            except Exception as init_error:
                print(f"[Debug] Could not add IP init script: {init_error}")

        page = context.new_page()



        print(f"[Debug] Navigating to live site: {SITE_URL}")
        page.goto(SITE_URL, wait_until="domcontentloaded", timeout=60000)

        if not ip_address:
            detected_ip = get_real_public_ip(page)
            if detected_ip:
                ip_address = detected_ip
                print(f"[Debug] Detected real public IP: {ip_address}")
                # Store detected IP back in data so it gets passed to certificate
                data["IP Address"] = ip_address

        try:
            page.wait_for_load_state("networkidle", timeout=15000)
        except Exception:
            pass

        inject_visible_cursor(page)
        
        if ip_address:
            set_ip_address_on_page(page, ip_address)

        time.sleep(random.uniform(0.9, 1.8))

        form_ready = wait_for_live_form(page)

        if not form_ready:
            print("[Debug] Form not visible immediately. Scrolling toward form.")
            page.mouse.wheel(0, 900)
            time.sleep(random.uniform(0.8, 1.4))
            form_ready = wait_for_live_form(page)

        if not form_ready:
            raise RuntimeError("Could not locate the eligibility form on the live site.")

        if ip_address:
            set_ip_address_on_page(page, ip_address)

        time.sleep(random.uniform(0.7, 1.3))

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
                "field_name": "mobile_phone",
                "value": mobile_phone,
                "reduced_mistake": False,
                "compare_digits": True,
            },
            {
                "type": "text",
                "field_name": "email",
                "value": email,
                "reduced_mistake": False,
                "compare_digits": False,
                "optional": True,
            },
            {
                "type": "dropdown",
                "field_name": "state",
                "value": state,
            },
            {
                "type": "dropdown",
                "field_name": "has_medicare",
                "value": has_medicare,
            },
            {
                "type": "textarea",
                "field_name": "ongoing_conditions",
                "value": ongoing_conditions,
                "reduced_mistake": False,
                "compare_digits": False,
                "optional": True,
            },
        ]

        if random.random() < 0.12:
            first_three = fields[:3]
            random.shuffle(first_three)
            fields = first_three + fields[3:]

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
                dropdown = get_select(page, field["field_name"])

                if not dropdown:
                    print(f"[Debug] Dropdown field not found: {field['field_name']}")
                    continue

                select_dropdown_option(page, dropdown, field["value"], user_profile)

            elif field["type"] == "textarea":
                if field.get("optional") and not field["value"]:
                    continue

                locator = get_textarea(page, field["field_name"])

                if not locator:
                    print(f"[Debug] Textarea field not found: {field['field_name']}")
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

            if ip_address:
                set_ip_address_on_page(page, ip_address)
            natural_mouse_idle(page, user_profile)
            time.sleep(random.uniform(0.38, 0.92))

        should_contact_consent = should_check_box(contact_consent, default_yes=True)
        should_privacy_terms = should_check_box(privacy_terms, default_yes=True)
        should_tax_debt_consent = should_check_box(tax_debt_consent, default_yes=True)

        submit_first_behavior = (
            should_contact_consent
            and should_privacy_terms
            and should_tax_debt_consent
            and random.random() < 0.20
        )

        if submit_first_behavior:
            print("[Debug] Simulating realistic mistake: submit before required checkboxes")

            submit_button = first_visible_locator(
                page,
                [
                    page.get_by_role("button", name=re.compile(r"submit.*request|submit", re.I)),
                    page.locator('button[type="submit"]'),
                    page.locator("button").filter(has_text=re.compile(r"submit", re.I)),
                ],
            )

            if submit_button:
                human_mouse_move_to_element(page, submit_button, user_profile)
                time.sleep(random.uniform(0.30, 0.75))
                submit_button.click()

                print("[Debug] Clicked submit before checking consent boxes")
                time.sleep(random.uniform(1.0, 2.4))
                print("[Debug] Returning to required checkboxes after validation issue")

            time.sleep(random.uniform(0.50, 1.0))
        else:
            print("[Debug] Normal flow: checkboxes before submit")
            time.sleep(random.uniform(0.50, 1.0))

        if should_contact_consent:
            click_checkbox_by_text_or_index(
                page,
                "By checking this box",
                0,
                user_profile,
            )

        time.sleep(random.uniform(0.45, 0.90))

        if should_privacy_terms:
            click_checkbox_by_text_or_index(
                page,
                "I have read and agree",
                1,
                user_profile,
            )

        time.sleep(random.uniform(0.45, 0.90))

        if should_tax_debt_consent:
            click_checkbox_by_text_or_index(
                page,
                "Tax debt",
                2,
                user_profile,
            )

        time.sleep(random.uniform(0.60, 1.25))

        if ip_address:
            set_ip_address_on_page(page, ip_address)

        validate_form_before_submit(page)

        if ip_address:
            set_ip_address_on_page(page, ip_address)

        hide_receipt_until_override(page)
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