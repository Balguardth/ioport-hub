# IOport Hub Documentation

## Main Hub Installation

  * Install the Yarn Package Manager from [yarnpkg.com](https://yarnpkg.com).
  * Fetch the source files from GitHub using source: 'https://github.com/Balguardth/ioport-hub.git'.
    * Use command: > 'git clone https://github.com/Balguardth/ioport-hub.git'
  * Change to the directory for the project (ex: ./ioport-hub/).  
  * Run 'yarn init -2'.
  * Delete the 'package.json' file that was created by the yarn init -2 process since we will use the one with the IOport Hub configuration.
  * Rename 'package.json.master' to 'package.json'.
  * Run 'yarn install' to update/add all of the additional required files based on the package.son file if needed.
  * Run 'yarn updatehub' to update IOport Hub as needed or directly before installing any IOport Hub applications.

## IOport Blip Installation (Optional)

  * Run > 'yarn installblip' from the project directory. 
