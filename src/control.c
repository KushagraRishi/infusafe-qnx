/*
 * Control interface.
 *
 * On QNX this is a resource manager: the monitor shows up in the
 * filesystem as /dev/infusafe, so any shell or program can drive it:
 *
 *     cat /dev/infusafe                   # live status as JSON
 *     echo "inject occlusion" > /dev/infusafe
 *     echo clear > /dev/infusafe
 *
 * On other systems it reads the same commands from stdin.
 */
#include "monitor.h"

#include <stdio.h>
#include <string.h>

#include "rt.h"

#ifdef __QNX__
#include <errno.h>
#include <stdlib.h>
#include <sys/dispatch.h>
#include <sys/iofunc.h>
#include <sys/neutrino.h>

#define DEVICE_PATH "/dev/infusafe"

static monitor_t *g_mon;
static resmgr_connect_funcs_t g_connect_funcs;
static resmgr_io_funcs_t g_io_funcs;
static iofunc_attr_t g_attr;

/* Each open() gets a fresh status snapshot, so `cat` sees one report. */
static char g_status[2048];
static int  g_status_len;

static int io_open(resmgr_context_t *ctp, io_open_t *msg,
                   RESMGR_HANDLE_T *handle, void *extra)
{
    g_status_len = monitor_status_json(g_mon, g_status, sizeof g_status);
    return iofunc_open_default(ctp, msg, handle, extra);
}

static int io_read(resmgr_context_t *ctp, io_read_t *msg, RESMGR_OCB_T *ocb)
{
    int status = iofunc_read_verify(ctp, msg, ocb, NULL);
    if (status != EOK) return status;
    if ((msg->i.xtype & _IO_XTYPE_MASK) != _IO_XTYPE_NONE) return ENOSYS;

    off_t off = ocb->offset;
    size_t nbytes = 0;
    if (off < g_status_len) {
        nbytes = (size_t)(g_status_len - off);
        if (nbytes > msg->i.nbytes) nbytes = msg->i.nbytes;
    }
    _IO_SET_READ_NBYTES(ctp, nbytes);
    if (nbytes == 0) return _RESMGR_NPARTS(0);

    SETIOV(ctp->iov, g_status + off, nbytes);
    ocb->offset += nbytes;
    return _RESMGR_NPARTS(1);
}

static int io_write(resmgr_context_t *ctp, io_write_t *msg, RESMGR_OCB_T *ocb)
{
    int status = iofunc_write_verify(ctp, msg, ocb, NULL);
    if (status != EOK) return status;
    if ((msg->i.xtype & _IO_XTYPE_MASK) != _IO_XTYPE_NONE) return ENOSYS;

    char line[128];
    size_t n = msg->i.nbytes < sizeof line - 1 ? msg->i.nbytes : sizeof line - 1;
    if (resmgr_msgget(ctp, line, n, sizeof msg->i) == -1) return errno;
    line[n] = '\0';
    char *nl = strchr(line, '\n');
    if (nl) *nl = '\0';

    char reply[256];
    monitor_command(g_mon, line, reply, sizeof reply);
    printf("cmd: %s -> %s", line, reply);
    fflush(stdout);

    _IO_SET_WRITE_NBYTES(ctp, msg->i.nbytes);
    return _RESMGR_NPARTS(0);
}

static void *control_thread(void *arg)
{
    dispatch_t *dpp = arg;
    dispatch_context_t *ctp = dispatch_context_alloc(dpp);
    while (ctp) {
        ctp = dispatch_block(ctp);
        if (ctp) dispatch_handler(ctp);
    }
    return NULL;
}

int control_start(monitor_t *m)
{
    g_mon = m;
    dispatch_t *dpp = dispatch_create();
    if (!dpp) { perror("dispatch_create"); return -1; }

    resmgr_attr_t rattr;
    memset(&rattr, 0, sizeof rattr);
    rattr.nparts_max = 1;
    rattr.msg_max_size = 2048;

    iofunc_func_init(_RESMGR_CONNECT_NFUNCS, &g_connect_funcs,
                     _RESMGR_IO_NFUNCS, &g_io_funcs);
    g_connect_funcs.open = io_open;
    g_io_funcs.read = io_read;
    g_io_funcs.write = io_write;
    iofunc_attr_init(&g_attr, S_IFCHR | 0666, NULL, NULL);

    if (resmgr_attach(dpp, &rattr, DEVICE_PATH, _FTYPE_ANY, 0,
                      &g_connect_funcs, &g_io_funcs, &g_attr) == -1) {
        perror("resmgr_attach " DEVICE_PATH);
        return -1;
    }

    /* Below the monitor (50) and sensor (40): commands never delay safety. */
    pthread_t th;
    if (rt_thread_start(&th, 10, control_thread, dpp) != 0) return -1;
    printf("control: %s ready (cat it for status, echo commands into it)\n",
           DEVICE_PATH);
    return 0;
}

#else /* ---------------------------------------------------- stdin */

static void *stdin_thread(void *arg)
{
    monitor_t *m = arg;
    char line[128], reply[2048];
    while (fgets(line, sizeof line, stdin)) {
        char *nl = strchr(line, '\n');
        if (nl) *nl = '\0';
        if (line[0] == '\0') continue;
        monitor_command(m, line, reply, sizeof reply);
        fputs(reply, stdout);
        fflush(stdout);
    }
    return NULL;
}

int control_start(monitor_t *m)
{
    pthread_t th;
    if (pthread_create(&th, NULL, stdin_thread, m) != 0) return -1;
    pthread_detach(th);
    printf("control: type commands (inject <fault>, clear, status, quit)\n");
    return 0;
}

#endif
