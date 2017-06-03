# Goal:

We'd like to get this library: https://github.com/bbc/audiowaveform

Running on AWS Lambda. The AMI lambda uses is `amzn-ami-hvm-2016.03.3.x86_64-gp2`

Here are a few github issues on the repo regarding this:

# Relevant github issues:

How to install on Amazon Lambda? https://github.com/bbc/audiowaveform/issues/35

Installing on AWS Linux? https://github.com/bbc/audiowaveform/issues/27

# Running on AWS Lambda

1. `npm run zip`
2. upload `function.zip` to lambda and run

# Docker commands to install audiowaveform:

```
# install audiowaveform
RUN apt-get install -y wget git-core make cmake gcc g++ libmad0-dev libid3tag0-dev libsndfile1-dev libgd2-xpm-dev libboost-filesystem-dev libboost-program-options-dev libboost-regex-dev
WORKDIR ~
RUN git clone https://github.com/bbc/audiowaveform.git
WORKDIR audiowaveform/
RUN wget https://github.com/google/googletest/archive/release-1.8.0.tar.gz
RUN tar xzf release-1.8.0.tar.gz
RUN ln -s googletest-release-1.8.0/googletest googletest
RUN ln -s googletest-release-1.8.0/googlemock googlemock
RUN mkdir build
WORKDIR build/
RUN cmake ..
RUN make
RUN make test
RUN make install
```

**The included version of `audiowaveform` was built on Ubuntu, but it should be built instead of Amazon Linux.**

# Current issue

When you upload and run `function.zip`, you get this error:

```
{
  "errorMessage": "Command failed: ./audiowaveform/audiowaveform\n./audiowaveform/audiowaveform: error while loading shared libraries: libsndfile.so.1: cannot open shared object file: No such file or directory\n",
  "errorType": "Error",
  "stackTrace": [
    "./audiowaveform/audiowaveform: error while loading shared libraries: libsndfile.so.1: cannot open shared object file: No such file or directory",
    "",
    "ChildProcess.exithandler (child_process.js:204:12)",
    "emitTwo (events.js:106:13)",
    "ChildProcess.emit (events.js:191:7)",
    "maybeClose (internal/child_process.js:886:16)",
    "Socket.<anonymous> (internal/child_process.js:342:11)",
    "emitOne (events.js:96:13)",
    "Socket.emit (events.js:188:7)",
    "Pipe._handle.close [as _onclose] (net.js:501:12)"
  ]
}
```

This says to me that `libsndfile` is not included in the `audiowaveform` directory. So we need a way to do that. Is that statically linking? IDK. Halp.