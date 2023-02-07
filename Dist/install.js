#!/usr/bin/env node
const {exec} = require('child_process');
const readline = require('readline');
const packageJson = require('@npmcli/package-json');
const util = require('util');

const appInstallParams = {
  name: null,
  installDir: null,
  packageContents: null,
  command: null,
  repoUrl: null,
  outputMsgStart: null,
  outputMsgEnd: null
};

const outputMsgInvalidArgs = "Invalid command arguments.  Usage: installblip <appType[hub, blip, ...]> " +
                             "<installType[clone, update, ...]>";

const packageUpdate = {
  hub: {
    scripts: {
      "updatehub": "./Dist/install.js 'hub' 'update'",
      "installblip": "./Dist/install.js 'blip' 'clone'"
    }
  },
  blip: {
    scripts: {
      "runblip": "node ./ioport-blip/Server/File-Server.js",
      "updateblip": "./Dist/install.js 'blip' 'update'"
    },
    dependencies: {
      "connect-static-file": "^2.0.0",
      "express": "^4.18.2",
      "extract-zip": "^2.0.1",
      "ioport-blip": "workspace:*",
      "ioport-blip-client": "workspace:*",
      "ioport-blip-server": "workspace:*",
      "jabber": "^1.5.2",
      "moment": "^2.29.4",
      "sizeof": "^1.0.0",
      "uid-safe": "^2.1.5",
      "winston": "^3.8.2",
      "winston-daily-rotate-file": "^4.7.1",
      "yauzl": "^2.10.0"
    },
    workspaces:[
      "ioport-blip",
      "ioport-blip/Client",
      "ioport-blip/Server"
    ]
  }
}

const args = process.argv.slice(2);

if( args.length != 2 ){
  console.error(outputMsgInvalidArgs);
  process.exit(1);
}

const appType = {
  hub: {
    arg: "hub",
    installDir: "./",
    packageContents: packageUpdate.hub,
    repoUrl: "https://github.com/Balguardth/ioport-hub.git"
  },
  blip: {
    arg: "blip",
    installDir: "./ioport-blip",
    packageContents: packageUpdate.blip,
    repoUrl: "https://github.com/Balguardth/ioport-blip.git"
  }
}

switch(args[0]){

    case appType.blip.arg:
      appInstallParams.name = appType.blip.arg;
      appInstallParams.installDir = appType.blip.installDir;
      appInstallParams.packageContents = appType.blip.packageContents;
      appInstallParams.repoUrl = appType.blip.repoUrl;
      break;
    case appType.hub.arg:
      appInstallParams.name = appType.hub.arg;
      appInstallParams.installDir = appType.hub.installDir;
      appInstallParams.packageContents = appType.hub.packageContents;
      appInstallParams.repoUrl = appType.hub.repoUrl;
      break;
    default:
      console.log(outputMsgInvalidArgs);
      process.exit(1);

}

const installType = {
  clone: {
    arg: "clone",
    command: "git clone " + appInstallParams.repoUrl + " " + appInstallParams.installDir,
    outputMsgStart: "Installing " + appInstallParams.name + " as git clone from " + appInstallParams.repoUrl,
    outputMsgEnd: "The IOport Hub package.json file is now updated with new script options."
  },
  update: {
    arg: "update",
    command: "git reset --hard origin/master",
    outputMsgStart: "Updating " + appInstallParams.name + " from git repo: " + appInstallParams.repoUrl,
    outputMsgEnd: "Any missing files have been added and any outdated files updated."
  }
};

switch(args[1]){

    case installType.clone.arg:
      appInstallParams.command = installType.clone.command;
      appInstallParams.outputMsgStart = installType.clone.outputMsgStart;
      appInstallParams.outputMsgEnd = installType.clone.outputMsgEnd;
      break;
    case installType.update.arg:
      appInstallParams.command = installType.update.command;
      appInstallParams.outputMsgStart = installType.update.outputMsgStart;
      appInstallParams.outputMsgEnd = installType.update.outputMsgEnd;
      break;
    default:
      console.log(outputMsgInvalidArgs);
      process.exit(1);

}

if(args[1] == installType.update.arg){

  // Prompt user to backup application source directory.
  const rl = readline.createInterface({input: process.stdin, output: process.stdout});
  const questStr = "Files will be overwriten if they do not match the source and it is recommended " +
                   "that you backup all files before proceeding.  The package.json file(s) in particular. " +
                   "Press [Y] to continue: ";


  rl.question(questStr, ans => {
    if (ans == 'y' || ans == 'Y'){

      console.log('Proceeding...');
      // Change to working directory of application source.
      process.chdir(appInstallParams.installDir);
      execCommand();

    }
    else {

      console.log('Exiting without updating.');
      rl.close();

    }

  });

} else {

  execCommand();

}

function execCommand(){

  exec(appInstallParams.command, (error, stdout, stderr) => {

      if (error) {
        if( String(error).includes("already exists and is not an empty directory") ){

          console.log("Installation directory already exists and is not empty.");

        } else {

          console.log(error);

        }

        process.exit(1);

      }

      console.log(appInstallParams.outputMsgStart);
      console.log(appInstallParams.outputMsgEnd);

      if(appInstallParams.packageContents){

        updatePackageJsonFile(appInstallParams.packageContents).then((err) => {

          if(err) {

            console.log(err);
            process.exit(1);

          }

          yarnInstall().then((err) => {

            if(err) {

              console.log(err);
              process.exit(1);
  
            }

            operationComplete();

          });          

        });

      } else {

        operationComplete();

      }

      function operationComplete(){

        console.log("Total operation has completed.");
        process.exit(1);

      }      

  });

}

async function updatePackageJsonFile(contents){  

  let pkgJson = null;

  try{

  pkgJson = await packageJson.load(__dirname + '/../');

  } catch(err) {

    console.error(err);
    process.exit(1);

  }

  console.log("Updating package.json");

  if (contents.scripts != undefined) {

    pkgJson.update({

      scripts: mergePackageJsonMembers(pkgJson.content.scripts, contents.scripts)

    });

  }

  if (contents.dependencies != undefined) {

    pkgJson.update({

      dependencies: mergePackageJsonMembers(pkgJson.content.dependencies, contents.dependencies),

    });

  }

  if (contents.workspaces != undefined) {

    pkgJson.update({

      workspaces: mergePackageJsonMembers(pkgJson.content.workspaces, contents.workspaces),

    });

  }

  await pkgJson.save();

  return false;

}

async function yarnInstall(){ 

  const execYarnInstall = util.promisify(exec);
  const promise = execYarnInstall('yarn install');
  const child = promise.child; 

  child.stdout.on('data', function(data) {

    console.log(data.trim());

  });

  child.stderr.on('data', function(data) {

    console.log(data.trim());
    process.exit(1);

  });

  child.on('close', function(code) {

    console.log('Yarn install complete.');

  });

  try{
    
    console.log('Running "yarn install" to download any missing dependencies.');
    const { stdout, stderr } = await promise; 
    return false;

  }  
  catch(err) {

    return err;

  }

}

function mergePackageJsonMembers(source1, source2){

  if(source1 == undefined && source2 != undefined){

    return(source2);

  } else if( source1 != undefined && source2 == undefined ) {

    return(source1);

  }

  if(Array.isArray(source1) && Array.isArray(source2)){

    let largerArray = [];
    let smallerArray = [];

    if(source1.length > source2.length) {

      largerArray = source1;
      smallerArray = source2;

    } else {

      largerArray = source2;
      smallerArray = source1;

    }

    return largerArray.concat(smallerArray).filter((value, pos, arr)=>arr.indexOf(value)===pos);

  } else if( Object.getPrototypeOf(source1) === Object.prototype && 
             Object.getPrototypeOf(source2) === Object.prototype)  {

    return {...source1, ...source2};    

  } else {

    console.log('Error: Merging package.json members.  Type mismatch, both source members are not the same.');
    process.exit(1);

  }  

}
