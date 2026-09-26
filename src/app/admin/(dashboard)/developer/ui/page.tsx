"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import { FileQuestion } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  Input,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Link001,
  Link002,
} from "@/components/ui";

const THEMES = ["cream", "sepia", "night"] as const;

export default function UiSmokePage() {
  if (process.env.NODE_ENV === "production") notFound();

  const [theme, setTheme] = React.useState<string>("cream");
  const [archive, setArchive] = React.useState(false);

  return (
    <TooltipProvider>
      <PageHeader
        title="UI primitives"
        subtitle="14 primitives · 4 surfaces · dev only"
        actions={
          <div className="flex gap-1.5">
            {THEMES.map((t) => (
              <Button
                key={t}
                size="sm"
                variant={theme === t && !archive ? "primary" : "secondary"}
                onClick={() => {
                  setTheme(t);
                  setArchive(false);
                }}
              >
                {t}
              </Button>
            ))}
            <Button
              size="sm"
              variant={archive ? "primary" : "secondary"}
              onClick={() => setArchive(true)}
            >
              archive
            </Button>
          </div>
        }
      />

      <div
        data-theme={archive ? undefined : theme}
        data-surface={archive ? "archive" : undefined}
        className="rounded-card bg-surface p-6 text-content"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Buttons &amp; Skiper UI</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-wrap items-center gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button disabled>Disabled</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
              <div className="my-2 flex w-full items-center gap-4 border-t border-rule pt-3">
                <Link001 href="#">Skiper Link001</Link001>
                <Link002 href="#">Skiper Link002</Link002>
              </div>
            </CardBody>
            <CardFooter>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" size="sm">
                    Hover me
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Tooltip on the raised surface</TooltipContent>
              </Tooltip>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Form</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <Input placeholder="Piece title" />
              <Input defaultValue="পদ্মা নদীর মাঝি" className="font-body" />
              <Textarea placeholder="Excerpt" />
              <Select defaultValue="draft">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-wrap gap-2">
              <Badge tone="accent">Accent</Badge>
              <Badge tone="neutral">Neutral</Badge>
              <Badge tone="success">Published</Badge>
              <Badge tone="warning">Review</Badge>
              <Badge tone="danger">Failed</Badge>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Overlays &amp; tabs</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-wrap items-start gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Open dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>Delete this piece?</DialogTitle>
                  <p className="mt-2 font-ui text-step-0 text-content-soft">
                    This cannot be undone.
                  </p>
                  <DialogFooter>
                    <Button variant="ghost">Cancel</Button>
                    <Button variant="danger">Delete</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary">Actions</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Duplicate</DropdownMenuItem>
                  <DropdownMenuItem>Archive</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tabs defaultValue="one" className="w-full">
                <TabsList>
                  <TabsTrigger value="one">প্রতিলিপি</TabsTrigger>
                  <TabsTrigger value="two">ক্যাপশন</TabsTrigger>
                </TabsList>
                <TabsContent value="one" className="font-ui text-step-0 text-content-soft">
                  First panel
                </TabsContent>
                <TabsContent value="two" className="font-ui text-step-0 text-content-soft">
                  Second panel
                </TabsContent>
              </Tabs>
            </CardBody>
          </Card>

          <div className="lg:col-span-2">
            <Table>
              <THead>
                <TR>
                  <TH>Title</TH>
                  <TH>Status</TH>
                  <TH>Updated</TH>
                </TR>
              </THead>
              <TBody>
                <TR>
                  <TD className="font-body text-content">দেবী</TD>
                  <TD>
                    <Badge tone="success">Published</Badge>
                  </TD>
                  <TD className="font-mono">2026-08-14</TD>
                </TR>
                <TR>
                  <TD className="font-body text-content">বিমলা</TD>
                  <TD>
                    <Badge tone="warning">Draft</Badge>
                  </TD>
                  <TD className="font-mono">2026-08-02</TD>
                </TR>
              </TBody>
            </Table>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Skeleton</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </CardBody>
          </Card>

          <EmptyState
            icon={<FileQuestion className="h-7 w-7" />}
            title="No pieces yet"
            description="Published writing will appear here once you create your first piece."
            action={<Button size="sm">New piece</Button>}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
