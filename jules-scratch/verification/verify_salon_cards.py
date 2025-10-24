
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173/")
        page.wait_for_selector(".salones-container-vista-unica")
        page.screenshot(path="jules-scratch/verification/salon_cards_fixed.png")
        browser.close()

if __name__ == "__main__":
    run()
