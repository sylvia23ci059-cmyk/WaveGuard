import os
import zipfile
from pathlib import Path

def package_waveguard():
    root_dir = Path(__file__).resolve().parent.parent
    zip_output_path = root_dir / "WaveGuard_Complete_Project.zip"

    # Files and folders to include
    include_paths = [
        "backend",
        "frontend",
        "data",
        "docs",
        "scripts",
        "README.md",
        ".gitignore",
        ".env.example",
        "start_waveguard.bat",
    ]

    # Patterns or names to exclude
    exclude_dirs = {
        "node_modules",
        ".venv",
        "venv",
        "__pycache__",
        "dist",
        "build",
        ".pytest_cache",
        ".git",
        ".vscode",
        ".idea",
    }
    
    exclude_files = {
        ".env",
        "backend.log",
        "backend_err.log",
        "frontend.log",
        "frontend_err.log",
        "waveguard.db",
        "waveguard_kgf.db",
        "Taluk.zip",
        "boundary.zip",
        "WaveGuard_KGF_Complete_Project.zip",
        "WaveGuard_Complete_Project.zip",
    }

    print(f"Creating zip archive: {zip_output_path} ...")
    file_count = 0

    with zipfile.ZipFile(zip_output_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for item in include_paths:
            item_path = root_dir / item
            if not item_path.exists():
                print(f"Warning: {item} does not exist. Skipping.")
                continue

            if item_path.is_file():
                if item_path.name not in exclude_files and not item_path.name.endswith(".db"):
                    arcname = item
                    zipf.write(item_path, arcname)
                    file_count += 1
            else:
                for root, dirs, files in os.walk(item_path):
                    # Prune excluded directories in-place
                    dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith(".")]

                    for file in files:
                        if file in exclude_files:
                            continue
                        if file.endswith((".pyc", ".pyo", ".log", ".db", ".sqlite")):
                            continue
                        if file == ".env":
                            continue

                        full_path = Path(root) / file
                        arcname = full_path.relative_to(root_dir)
                        zipf.write(full_path, arcname)
                        file_count += 1

    zip_size_mb = os.path.getsize(zip_output_path) / (1024 * 1024)
    print(f"Successfully packaged {file_count} files into '{zip_output_path.name}' ({zip_size_mb:.2f} MB).")

    # Verification inspection
    print("\n--- Verifying Archive Contents ---")
    with zipfile.ZipFile(zip_output_path, "r") as check_zip:
        namelist = check_zip.namelist()
        print(f"Total files in archive: {len(namelist)}")
        
        # Verify critical files exist
        critical_checks = [
            "backend/app/main.py",
            "backend/app/services/classification.py",
            "backend/app/routing/router.py",
            "backend/requirements.txt",
            "backend/.env.example",
            "frontend/src/App.tsx",
            "frontend/src/pages/OverviewDashboard.tsx",
            "frontend/src/pages/RouteGuidance.tsx",
            "frontend/package.json",
            "data/sample_locations.geojson",
            "data/demo_road_graph/bengaluru_corridors.json",
            "docs/SYSTEM_ARCHITECTURE.md",
            "docs/API_DOCUMENTATION.md",
            "start_waveguard.bat",
            "README.md",
        ]
        
        all_passed = True
        for cc in critical_checks:
            if cc in namelist:
                print(f" [OK] {cc}")
            else:
                print(f" [MISSING] {cc}")
                all_passed = False

        # Verify excluded items are absent
        forbidden_substrings = ["node_modules", ".venv", "__pycache__", ".env\n"]
        for name in namelist:
            if name.endswith("/.env") or name == ".env":
                print(f" [SECURITY LEAK DETECTED] Real .env included: {name}")
                all_passed = False
            for fb in ["node_modules/", ".venv/"]:
                if fb in name:
                    print(f" [FORBIDDEN DIR INCLUDED]: {name}")
                    all_passed = False

        if all_passed:
            print("\n Archive Verification PASSED! Clean, complete distribution.")
        else:
            print("\n Archive Verification FAILED!")

if __name__ == "__main__":
    package_waveguard()
