#!/proc/boot/ksh
# InfuSafe demo, run on the QNX target.

echo "== 1. Unit tests"
test_rules

echo
echo "== 2. A typo: 500 mL/h of chemo instead of 50"
infusafe -d chemo-a -r 500 -v 200

echo
echo "== 3. Start the pump at 50 mL/h"
infusafe -d chemo-a -r 50 -v 200 &
sleep 1
cat /dev/infusafe

for f in occlusion air free-flow sensor-hang; do
    echo
    echo "== Fault: $f"
    echo "inject $f" > /dev/infusafe
    sleep 1
    cat /dev/infusafe
    echo clear > /dev/infusafe
    sleep 1
done

echo "quit" > /dev/infusafe
sleep 1

echo
echo "== 4. Bench: each fault 100 times"
infusafe -b 100
