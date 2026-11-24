# Records the replay of a real QNX 8.0 session (see capture.py, replay.py).
#   python3 video/capture.py && vhs video/qnx-session.tape
Output build/video/qnx-session.mp4

Set Shell zsh
Set FontFamily "Menlo"
Set FontSize 22
Set Width 1600
Set Height 900
Set Padding 36
Set Theme "Catppuccin Mocha"
Set WindowBar Colorful
Set WindowBarSize 36

Hide
Type "cd ~/Developer/infusafe-qnx && clear && python3 video/replay.py"
Enter
Sleep 300ms
Show

Wait+Screen@240s /End of the QNX session/
Sleep 3.5s
